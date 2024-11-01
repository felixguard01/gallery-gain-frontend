<template>
  <div>
    <!-- Navbar Component -->
    <Navbar />

    <!-- Header with Search Bar -->
    <header class="header">
      <div class="container">
        <div class="search-bar">
          <input type="text" placeholder="ค้นหาภาพถ่ายที่คุณต้องการ" v-model="searchQuery" />
          <button @click="handleSearch"><img src="../static/home/search.png" alt="" /></button>
        </div>
      </div>
    </header>

    <!-- Popular Tags (Categories) -->
    <section class="tags-section">
      <div class="tags">
        <button v-for="tag in availableCategories" :key="tag" @click="filterByTag(tag)">
          {{ tag }}
        </button>
        <!-- ปุ่ม 'ทั้งหมด' เพื่อแสดงภาพถ่ายทั้งหมด -->
        <button @click="showAllImages">ทั้งหมด</button>
      </div>
    </section>


    <!-- Dynamic Image Grid -->
    <section class="image-grid-section">
      <div class="image-grid">
        <div v-for="image in filteredImages" :key="image.id" class="image-item" @click="showImageDetails(image)">
          <img :src="image.imagePreview" :alt="image.mediaName" />
          <div class="watermark">{{ image.mediaWatermark }}</div>
        </div>
      </div>
    </section>

    <!-- Pagination -->
    <section class="pagination-section">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>{{ currentPage }}</span>
      <button class="" @click="nextPage" :disabled="!hasMorePages">Next</button>
    </section>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';

export default {
  data() {
    return {
      searchQuery: '',
      availableCategories: [],
      images: [],
      filteredImages: [],
      selectedImage: null,
      currentPage: 1,
      imagesPerPage: 15,
    };
  },

  computed: {
    displayedImages() {
      const start = (this.currentPage - 1) * this.imagesPerPage;
      return this.filteredImages.slice(start, start + this.imagesPerPage);
    },
    hasMorePages() {
      return this.currentPage * this.imagesPerPage < this.filteredImages.length;
    },
  },

  mounted() {
    this.getCategories();
    this.getPhotos();
  },

  methods: {
    // ดึงข้อมูลหมวดหมู่จาก Firebase
    getCategories() {
      const dbRef = firebase.database().ref('categories');
      dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.availableCategories = Object.values(data);
        }
      });
    },

    // ดึงข้อมูลรูปภาพจาก Firebase
    getPhotos() {
      const dbRef = firebase.database().ref('photos');
      dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const imgIds = Object.keys(data); // ดึง keys ของข้อมูล (imgId)
          this.images = Object.values(data); // ดึงค่าของข้อมูล (images)

          // รวม imgId เข้ากับแต่ละภาพใน images
          this.filteredImages = this.images.map((image, index) => ({
            ...image,
            id: imgIds[index], // เพิ่ม imgId ให้แต่ละ image
            status: 'Not paid',
          }));

          // console.log(this.filteredImages);
        }
      });
    },


    // ฟังก์ชันค้นหารูปภาพจากชื่อหรือหมวดหมู่
    handleSearch() {
      this.filteredImages = this.images.filter((image) => {
        return (
          image.mediaName.includes(this.searchQuery) ||
          image.mediaCategories.includes(this.searchQuery)
        );
      });
    },

    // ฟังก์ชันกรองรูปภาพตามหมวดหมู่
    filterByTag(tag) {
      this.filteredImages = this.images.filter((image) =>
        image.mediaCategories.includes(tag)
      );
    },

    // ฟังก์ชันแสดงรายละเอียดของรูปภาพด้วย Swal.fire
    showImageDetails(image) {
      this.selectedImage = image;

      Swal.fire({
        title: image.mediaName,
        html: `
    <div style="position: relative; display: inline-block; width: 100%; max-width: 400px;">
      <img src="${image.imagePreview}" alt="${image.mediaName}" style="width: 100%; height: auto; max-height: 60vh; object-fit: contain; margin-bottom: 15px;" />
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255, 255, 255, 0.5);
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        pointer-events: none;
      ">${image.mediaWatermark}</div>
    </div>
    <p><strong>Categories:</strong> ${image.mediaCategories}</p>
    <p><strong>License:</strong> ${image.mediaLicense}</p>
    <p><strong>Price:</strong> ${image.mediaPrice}</p>
  `,
        showCancelButton: true,
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'กลับ',
        width: '50%',
        padding: '1rem',
        backdrop: `rgba(0, 0, 0, 0.7)`,
        preConfirm: async () => {
          try {
            const user = await firebase.auth().currentUser;

            if (user) {
              const userId = await user.multiFactor.user.uid;
              if (userId) {
                // รวมข้อมูลผู้ใช้กับข้อมูลรูปภาพที่เลือก
                const selectedUser = {
                  userId: userId,
                  Image: this.selectedImage.id,
                  status: 'Not paid',
                };

                // บันทึกข้อมูลใน Firebase Realtime Database
                const orderRef = firebase.database().ref('carts');
                await orderRef.push(selectedUser); // ใช้ push เพื่อเพิ่มข้อมูลใหม่ใน orders

                // แสดงผลเมื่อสำเร็จ
                Swal.fire('Selected Image', 'You have selected this image.', 'success');
              } else {
                throw new Error('User not found');
              }
            }
          } catch (error) {
            Swal.fire('Error', error.message, 'error');
          }
        }
      });

    },

    // แสดงภาพถ่ายทั้งหมดเมื่อกดปุ่ม 'ทั้งหมด'
    showAllImages() {
      this.filteredImages = this.images;
    },





    // การเปลี่ยนหน้า pagination
    nextPage() {
      if (this.hasMorePages) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
};
</script>

<style scoped>
/* Layout Styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  padding: 1rem;
  background-image: url('../static/home/header.png');
  background-size: cover;
  background-position: center;
  height: 400px;
}

.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 0;
  margin-top: 1rem;
}

.search-bar input {
  padding: 0.5rem;
  border: 1px solid #ffffff;
  border-radius: 3px;
  width: 600px;
}

.search-bar button {
  background-color: #146799;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin-left: 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.tags-section {
  text-align: center;
  margin: 2rem 0;
}

.tags button {
  border-radius: 15px;
  background-color: white;
  border: 1px solid #146799;
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.tags button:hover {
  background-color: #146799;
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
  color: white;
}

.image-grid-section {
  padding: 1rem 1rem 2rem 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.2rem;
}

.image-item {
  position: relative;
  /* ทำให้สามารถวางลายน้ำไว้บนรูปภาพ */
}

.image-item img {
  width: 100%;
  border-radius: 5px;
  transition: all 0.1s ease-in-out;
}

.image-item:hover img {
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.5);
  /* สีขาวโปร่งใส */
  font-size: 24px;
  font-weight: bold;
  pointer-events: none;
  /* ป้องกันไม่ให้ลายน้ำรับการคลิก */
}


.pagination-section {
  text-align: center;
  margin: 2rem 0;
}

.pagination-section button {
  background-color: #146799;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin: 0 0.5rem;
  border-radius: 5px;
}

.pagination-section button:hover {
  background-color: #327ab9;
}

.pagination-section button:disabled {
  background-color: #ccc;
}

/* mobile */

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
