<template>
  <div>
    <!-- Navbar Component -->
    <Navbar />

    <!-- Header with Search Bar -->
    <header class="header">
      <div class="container">
        <div class="search-bar">
          <input type="text" placeholder="ค้นหาภาพถ่ายที่คุณต้องการ" v-model="searchQuery" />
          <button @click="handleSearch"><img src="../static/home/search.png" alt=""></button>
        </div>
      </div>
    </header>

    <!-- Introduction Section -->
    <section class="intro">
      <h2>สร้างความเชื่อมโยงที่ลึกซึ้งด้วยภาพถ่ายสต็อกที่สมจริง</h2>
      <p>
        เข้าถึงและดึงดูดผู้ชมของคุณด้วยคอลเลกชันภาพถ่ายสต็อกหลากหลายจาก <br>
        ที่มีให้เลือกหลายล้านภาพแบบไร้ค่าลิขสิทธิ์ ทั้งในหลากหลายรูปแบบและสไตล์ รวมถึงภาพพิเศษที่หาที่ไหนไม่ได้
      </p>
      <button @click="viewPlans">View Plans and Pricing</button>
    </section>

    <!-- Dynamic Popular Image Categories -->
    <section class="popular-categories container">
      <h3 class="mb-4">หมวดหมู่ยอดนิยม</h3>
      <div class="category-grid">
        <div v-for="category in categoriesWithImages" :key="category.name" class="category-card">
          <div class="image-container">
            <img :src="category.imagePreview" :alt="category.name" @click="goToHome" /> <!-- เพิ่ม @click -->
            <div class="watermark">{{ category.name }}</div> <!-- ลายน้ำที่ต้องการ -->
          </div>
          <p class="m-4">{{ category.name }}</p>
        </div>
      </div>
    </section>



    <!-- Social Media Links -->
    <section class="social-media">
      <h3>พร้อมที่จะเรียนรู้เพิ่มเติม</h3>
      <div class="social-icons">
        <a href="https://www.youtube.com/channel/example" target="_blank" class="social-icon">
          <img style="height: 40px; width: auto;" src="../static/home/Youtube.png" alt="YouTube" />
        </a>
        <a href="https://www.instagram.com/example" target="_blank" class="social-icon">
          <img style="height: 150px; width: auto; filter: invert(1);" src="../static/home/Instagram.png"
            alt="Instagram" />
        </a>
        <a href="https://www.pinterest.com/example" target="_blank" class="social-icon">
          <img style="height: 50px; width: auto; filter: invert(1);" src="../static/home/pinterest.png"
            alt="Pinterest" />
        </a>
      </div>
    </section>

    <!-- Dynamic Image Gallery -->
    <section class="gallery-section">
      <div class="gallery-grid container">
        <div v-for="image in galleryImages" :key="image.id" class="gallery-item">
          <div class="image-container">
            <img :src="image.imagePreview" :alt="image.mediaName" @click="showImageDetails(image)" />
            <div class="watermark">{{ image.mediaWatermark }}</div> <!-- ลายน้ำที่ต้องการ -->
            <!-- <pre>{{ image }}</pre> -->
          </div>
        </div>
      </div>
    </section>


    <hr>

    <!-- FAQ Section -->
    <section class="faq-section">
      <h3>คำถามที่พบบ่อย ?</h3>
      <div class="faq-list">
        <div v-for="faq in faqs" :key="faq.query" class="faq-item" @click="toggleAnswer(faq)">
          <div class="faq-question">
            <p>{{ faq.query }}</p>
            <span class="faq-toggle-icon">{{ faq.showAnswer ? '-' : '+' }}</span>
          </div>
          <transition name="fade">
            <p v-if="faq.showAnswer" class="faq-answer">{{ faq.message }}</p>
          </transition>
        </div>
      </div>
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
      galleryImages: [],
      categoriesWithImages: [],
      faqs: [],
    };
  },
  methods: {

    goToHome() {
      this.$router.push('/board');
    },

    toggleAnswer(faq) {
      faq.showAnswer = !faq.showAnswer;
    },
    // Fetch gallery images from Firebase
    fetchGalleryImages() {
      firebase.database().ref('photos').on('value', (snapshot) => {
        const images = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          images.push({
            id: childSnapshot.key,
            ...data
          });
        });
        this.galleryImages = images;
        this.fetchCategoriesWithImages(images); // Call to link images with categories
      });
    },

    // Fetch categories and link them with images
    fetchCategoriesWithImages(images) {
      firebase.database().ref('categories').on('value', (snapshot) => {
        const categories = snapshot.val();

        // ตรวจสอบให้แน่ใจว่า categories ไม่เป็น null หรือ undefined ก่อนใช้งาน map
        if (categories) {
          const categoriesWithImages = categories.map(category => {
            const categoryImages = images.filter(image =>
              image.mediaCategories && image.mediaCategories.includes(category)
            );
            return {
              name: category,
              imagePreview: categoryImages.length > 0 ? categoryImages[0].imagePreview : '',
            };
          }).filter(category => category.imagePreview !== '');
          this.categoriesWithImages = categoriesWithImages;
        } else {
          console.warn("No categories found.");
        }
      });
    },

    // Fetch FAQs from Firebase
    fetchFAQs() {
      firebase.database().ref('queries').on('value', (snapshot) => {
        const faqs = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          faqs.push({
            id: childSnapshot.key,
            ...data,
            showAnswer: false // Add a flag to control answer visibility
          });
        });
        this.faqs = faqs;
      });
    },

    // Handle search functionality
    handleSearch() {
      this.$router.push("/board");
      // const query = this.searchQuery.toLowerCase();
      // this.galleryImages = this.galleryImages.filter(image =>
      //   image.mediaName.toLowerCase().includes(query)
      // );
    },

    // Toggle FAQ answer visibility
    toggleAnswer(faq) {
      faq.showAnswer = !faq.showAnswer;
    },

    // Display image details in a modal
    showImageDetails(image) {
      Swal.fire({
        title: image.mediaName,
        html: `
      <div style="position: relative; display: inline-block;">
        <img src="${image.imagePreview}" alt="Image Preview" style="width: 100%; height: auto; max-width: 400px;"/>
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
        ">${image.mediaWatermark}</div></div>
      </div>
      <p>License: ${image.mediaLicense}</p>
      <p>Price: ${image.mediaPrice}</p>
    `,
        showCancelButton: true,
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'กลับ',
        width: '50%',
        padding: '1rem',
      });

      // ไปยังหน้า /board
      this.$router.push('/board');
    },


    // Navigate to pricing plans
    viewPlans() {
      window.location.href = '/plans';
    }
  },

  // Fetch data when the component is created
  created() {
    this.fetchGalleryImages();
    this.fetchFAQs();
  },
};
</script>

<style scoped>
.faq-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 2rem;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
}

.faq-section h3 {
  text-align: center;
  font-size: 2rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.faq-item:hover {
  background-color: #eaeaea;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  color: #333;
}

.faq-toggle-icon {
  font-size: 1.5rem;
  color: #666;
  transition: transform 0.3s ease;
}

.faq-answer {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.image-container {
  position: relative;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.5);
  /* สีขาวโปร่งใส */
  font-size: 16px;
  font-weight: bold;
  pointer-events: none;
  /* ป้องกันไม่ให้ลายน้ำรับการคลิก */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  /* เพิ่มเงาให้ลายน้ำ */
}

/* สำหรับภาพหมวดหมู่ยอดนิยม */
.category-card img {
  width: 100%;
  border-radius: 5px;
  transition: all 0.1s ease-in-out;
}

.category-card img:hover {
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
}

/* สำหรับภาพแกลเลอรี */
.gallery-item img {
  width: 100%;
  border-radius: 5px;
  transition: all 0.1s ease-in-out;
}

.gallery-item img:hover {
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
}

/* Basic Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  padding: 1rem;
  background-image: url('../static/home/header.png');
  background-size: cover;
  background-position: center;
  text-align: center;
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

.intro {
  text-align: center;
  margin: 3rem 0;
}

.intro button {
  background-color: #146799;
  color: white;
  width: 150px;
  font-size: 10px;
  margin-top: 15px;
  padding: 10px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* Popular Categories */
.popular-categories {
  text-align: center;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.category-card img {
  width: 100%;
  border-radius: 5px;
  transition: all 0.1s ease-in-out;
}

.category-card img:hover {
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
}

/* Social Media Section */
.social-media {
  background-color: #146799;
  padding: 2rem;
  text-align: center;
  color: white;
}

.social-icons a {
  margin: 0 1rem;
}

.social-icons img {
  width: 50px;
}

/* Gallery Section */
.gallery-section {
  text-align: center;
  margin: 3rem 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.gallery-item img {
  width: 100%;
  border-radius: 5px;
  transition: all 0.1s ease-in-out;
}

.gallery-item img:hover {
  transform: scale(1.01);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.196);
  transition: all 0.1s ease-in-out;
}

/* FAQ Section */
/* .faq-section {
  text-align: center;
  margin-top: 3rem;
  margin-bottom: 3rem;
}

.faq-list div {
  text-align: left;
  margin-top: 1rem;
  margin-left: 20rem;
  cursor: pointer;
} */
</style>
