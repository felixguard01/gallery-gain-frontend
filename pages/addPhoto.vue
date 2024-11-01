<template>
    <div>
        <div class="upload-photo-container scrollable-content">
            <div class="form-grid">
                <!-- Image Preview -->
                <div class="image-preview-container">
                    <img v-if="imagePreview" :src="imagePreview" alt="Image Preview" />
                    <img v-else src="https://dummyimage.com/300x200/000/fff" alt="Placeholder Image" />
                </div>

                <!-- File Upload -->
                <div class="upload-section">
                    <h1>Upload photo</h1>
                    <label for="file-upload">Select a photo</label>
                    <input type="file" id="file-upload" @change="onImageChange" class="file-input" />
                </div>

                <!-- Media Categories (Dropdown with multiple selections and add/remove functionality) -->
                <div class="form-field media-category">
                    <label>Media Categories</label>
                    <div class="category-dropdown">
                        <select v-model="selectedCategory" @change="addSelectedCategory" class="category-select">
                            <option disabled value="">select a category</option>
                            <option v-for="(category, index) in availableCategories" :key="index" :value="category">{{
                                category }}</option>
                        </select>
                        <input type="text" v-model="newCategory" placeholder="new category" class="category-input" />
                        <button @click="addNewCategory" class="add-category-button">Add</button>
                    </div>

                    <ul class="category-list">
                        <li v-for="(category, index) in mediaCategories" :key="index" class="category-item">
                            {{ category }}
                            <button @click="removeCategory(index)" class="remove-category-button">Remove</button>
                        </li>
                    </ul>
                </div>

                <!-- Form Fields -->
                <div class="form-fields">
                    <div class="form-field">
                        <label>Media name</label>
                        <input type="text" v-model="mediaName" class="form-input" />
                    </div>

                    <div class="form-field">
                        <label>Media watermark</label>
                        <input type="text" v-model="mediaWatermark" class="form-input" />
                    </div>

                    <div class="form-field">
                        <label>Media type</label>
                        <input type="text" v-model="mediaType" class="form-input" />
                    </div>

                    <div class="form-field">
                        <label>Media price</label>
                        <input type="number" v-model="mediaPrice" class="form-input" />
                    </div>

                    <div class="form-field">
                        <label>Media License</label>
                        <input type="text" v-model="mediaLicense" class="form-input" />
                    </div>
                </div>
            </div>
            <div style="text-align: end;">
                <!-- ปุ่มแสดงการโหลดหรือปุ่มเพิ่มภาพ -->
                <button v-if="!loading" class="add-photo-button" @click="uploadImageAndSaveData">Add Photo</button>
                <div v-if="loading" class="spinner-border text-warning" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';  // อย่าลืมตั้งค่า Firebase ใน plugins

export default {
  layout: 'MenuBar',

  async asyncData({ store }) {
    const page = 'addPhoto';
    store.commit('user/setPages', page);
  },

  data() {
    return {
      mediaName: '',
      mediaWatermark: '',
      mediaType: '',
      mediaPrice: null,
      mediaLicense: '',
      mediaCategories: [],
      availableCategories: ['Nature', 'Animals', 'Technology', 'People', 'Travel'],
      newCategory: '',
      selectedCategory: '', 
      imagePreview: null,
      file: null,
      loading: false,  // ตัวแปรจัดการการโหลด
    };
  },

  methods: {
    onImageChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.file = file;  // เก็บไฟล์ลงใน data
        this.imagePreview = URL.createObjectURL(file);  // แสดงตัวอย่างภาพ
      }
    },

    async uploadImageAndSaveData() {
      // แสดงการโหลด
      this.loading = true;

      if (!this.file) {
        Swal.fire('Error', 'Please select an image to upload.', 'error');
        this.loading = false;
        return;
      }

      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(`images/${this.file.name}`);

      try {
        // แสดง Swal กำลังโหลด
        Swal.fire({
          title: 'Uploading...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // อัพโหลดรูปไปที่ Firebase Storage
        const snapshot = await fileRef.put(this.file);
        const downloadURL = await snapshot.ref.getDownloadURL();

        // เตรียมข้อมูลที่จะเก็บใน Realtime Database
        const photoData = {
          mediaName: this.mediaName,
          mediaWatermark: this.mediaWatermark,
          mediaType: this.mediaType,
          mediaPrice: this.mediaPrice,
          mediaLicense: this.mediaLicense,
          mediaCategories: this.mediaCategories,
          imagePreview: downloadURL  // เก็บ URL ของรูปภาพที่อัพโหลด
        };

        // เก็บข้อมูลลงใน Realtime Database
        const dbRef = firebase.database().ref('photos');
        await dbRef.push(photoData);

        Swal.fire('Success', 'Photo uploaded and data saved successfully!', 'success');
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      } finally {
        this.loading = false;  // ปิดการโหลด
      }
    },

    addNewCategory() {
      if (this.newCategory && !this.availableCategories.includes(this.newCategory)) {
        this.availableCategories.push(this.newCategory);

        const dbRef = firebase.database().ref('categories');
        dbRef.set(this.availableCategories)
          .then(() => {
            Swal.fire('Success', 'New category added successfully!', 'success');
          })
          .catch((error) => {
            Swal.fire('Error', error.message, 'error');
          });

        this.newCategory = '';  // รีเซ็ตฟิลด์
      } else {
        Swal.fire('Error', 'Category already exists or invalid.', 'error');
      }
    },

    getCategories() {
      const dbRef = firebase.database().ref('categories');
      dbRef.on('value', (snapshot) => {
        const categoriesData = snapshot.val();
        if (categoriesData) {
          this.availableCategories = Object.values(categoriesData);
        } else {
          this.availableCategories = [];
        }
      });
    },

    addSelectedCategory() {
      if (this.selectedCategory && !this.mediaCategories.includes(this.selectedCategory)) {
        this.mediaCategories.push(this.selectedCategory);
        this.selectedCategory = '';  // รีเซ็ตการเลือก
      } else {
        Swal.fire('Error', 'Category already selected or invalid.', 'error');
      }
    },

    removeCategory(index) {
      this.mediaCategories.splice(index, 1);
    },
  },

  mounted() {
    this.getCategories();
  }
};



</script>


<style scoped>
.upload-photo-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 10px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.image-preview-container {
    grid-row: 1 / 4;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    border: 2px dashed #ccc;
    border-radius: 10px;
    padding: 20px;
}

img {
    width: 100%;
    max-width: 300px;
    height: auto;
}

.file-input {
    padding: 10px;
    background-color: #f1f1f1;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.category-dropdown {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.add-category-button {
    background-color: #166798;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
}

.add-category-button:hover {
    background-color: #0056b3;
}

.category-list {
    list-style: none;
    padding-left: 0;
}

.category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f1f1f1;
    border-radius: 5px;
    margin-bottom: 5px;
}

.remove-category-button {
    background-color: #d9534f;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
}

.remove-category-button:hover {
    background-color: #c9302c;
}

.form-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.add-photo-button {
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.add-photo-button:hover {
    background-color: #218838;
}

.scrollable-content {
    width: 100%;
    height: 80vh;
    overflow-y: scroll;
    padding: 10px;
    background-color: #fff;
    border-radius: 10px;
}

.scrollable-content::-webkit-scrollbar {
    width: 8px;
}

.scrollable-content::-webkit-scrollbar-thumb {
    background-color: #cccccc;
    border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
    background-color: #888888;
}

</style>