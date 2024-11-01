<template>
  <div class="scrollable-content">

    <div class="add-query-container">
      <h1>Add Query</h1>

      <div class="form-section">
        <!-- Input fields for Query and Message -->
        <div class="form-field">
          <input type="text" v-model="query" placeholder="Query" />
        </div>

        <div class="form-field">
          <input type="text" v-model="message" placeholder="Message" />
        </div>
      </div>
      <div style="width: 100%; display: flex; justify-content: end; padding-top: 50px;">
        <!-- Add Query button -->
        <button class="add-query-button" @click="addQuery">Add Query</button>
      </div>

      <h2>Queries List</h2>
      <div class="query-list">
        <!-- แสดงผลรายการ Queries ที่ดึงมาจาก Firebase -->
        <div v-for="(query, index) in queries" :key="index" class="query-item">
          <p><strong>Query:</strong> {{ query.query }}</p>
          <p><strong>Message:</strong> {{ query.message }}</p>
          <p><strong>Timestamp:</strong> {{ query.timestamp }}</p>
          <button @click="deleteQuery(query.id)">Delete</button> <!-- เพิ่มปุ่มลบ -->
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';  // ต้องตั้งค่า Firebase ใน plugins ก่อน

export default {
  layout: 'MenuBar',

  async asyncData({ store }) {
    const page = 'addQuery';
    store.commit('user/setPages', page);
  },

  data() {
    return {
      query: '',
      message: '',
      queries: [],  // เก็บข้อมูลที่ดึงมาจาก Firebase
    };
  },

  mounted() {
    this.getQueries();  // เรียกฟังก์ชันเมื่อคอมโพเนนต์ถูก mount
  },

  methods: {
    async addQuery() {
    if (this.query && this.message) {
      try {
        // แสดงการโหลด
        this.isLoading = true;
        Swal.fire({
          title: 'Adding...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // อ้างอิงไปยังเส้นทางที่ต้องการเก็บข้อมูล
        const dbRef = firebase.database().ref('queries');

        // เพิ่มข้อมูล query และ message ลงใน Firebase
        await dbRef.push({
          query: this.query,
          message: this.message,
          timestamp: new Date().toISOString(),  // เพิ่ม timestamp สำหรับเวลาที่บันทึก
        });

        // เคลียร์ฟิลด์หลังจากเพิ่มข้อมูลแล้ว
        this.query = '';
        this.message = '';

        // ปิดการโหลดและแจ้งเตือนผู้ใช้ว่าการบันทึกข้อมูลสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Query added successfully!',
          confirmButtonText: 'OK',
        });
      } catch (error) {
        // แสดงข้อผิดพลาดเมื่อเกิดข้อผิดพลาด
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Failed to add query: ${error.message}`,
          confirmButtonText: 'OK',
        });
      } finally {
        this.isLoading = false; // ปิดสถานะการโหลด
      }
    } else {
      // แสดงการแจ้งเตือนเมื่อกรอกข้อมูลไม่ครบ
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Fields',
        text: 'Please fill in both the query and message fields.',
        confirmButtonText: 'OK',
      });
    }
  },

  getQueries() {
    // แสดงการโหลด
    this.isLoading = true;
    Swal.fire({
      title: 'Loading...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const dbRef = firebase.database().ref('queries');

    // ดึงข้อมูลจาก Firebase เมื่อมีการเปลี่ยนแปลง
    dbRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const queriesArray = [];

      // เปลี่ยนข้อมูลจาก object เป็น array พร้อมกับเก็บ id (key) ของแต่ละรายการ
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          queriesArray.push({
            id: key, // เก็บ id ของ query
            ...data[key], // เก็บข้อมูล query
          });
        }
      }

      // อัปเดตข้อมูล queries ที่จะแสดงผล
      this.queries = queriesArray;

      // ปิดการโหลด
      Swal.close();
      this.isLoading = false;
    }, (error) => {
      // หากเกิดข้อผิดพลาดในการดึงข้อมูล
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to load queries: ${error.message}`,
        confirmButtonText: 'OK',
      });
      this.isLoading = false;
    });
  },
async deleteQuery(id) {
    try {
      // ยืนยันการลบจากผู้ใช้ก่อนทำการลบจริง
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this query?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        allowOutsideClick: false
      });

      if (result.isConfirmed) {
        // แสดงการโหลด
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // อ้างอิงไปยัง query ที่ต้องการลบจาก Firebase
        await firebase.database().ref('queries').child(id).remove();

        // แจ้งเตือนว่าลบสำเร็จ
        Swal.fire('Deleted!', 'The query has been deleted.', 'success');
      }
    } catch (error) {
      // แสดงข้อผิดพลาดเมื่อไม่สามารถลบได้
      Swal.fire('Error', `Failed to delete query: ${error.message}`, 'error');
    }
  }
  },
};
</script>

<style scoped>
.add-query-container {
  padding-top: 60px;
  max-width: 600px;
  margin: 0 auto;
  text-align: start;
}

h1,
h2 {
  font-size: 24px;
  margin-bottom: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-field {
  margin-bottom: 16px;
  width: 100%;
}

input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background-color: #166798;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.query-list {
  margin-top: 20px;
}

.query-item {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

.query-item p {
  margin: 0;
}

.scrollable-content {
  width: 100%;
  height: 85vh;
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
