<template>
  <div>
  <!-- Navbar Component -->
  <!-- <Navbar /> -->
  <div class="dashboard-page">
    
    <aside class="sidebar">

      <H2 style=" text-align: center; color: floralwhite;">Gallery Gain</H2>

      <nav class="menu">
        <h3>MENU</h3>
        <ul>
          <li :class="{ activemenu: pages === 'home' }"><nuxt-link
              to="/home">Home</nuxt-link></li>
              <!-- Add Photo -->
          <li :class="{ activemenu: pages === 'addPhoto' }"><nuxt-link
              to="/addPhoto">Add Photo</nuxt-link></li>
              <!-- Add Query -->
          <li :class="{ activemenu: pages === 'addQuery' }"><nuxt-link
              to="/addQuery">Add Query</nuxt-link></li>
              <!-- Manage Orders -->
          <li :class="{ activemenu: pages === 'manageOrders' }"><nuxt-link
              to="/manageOrders">Manage Orders</nuxt-link></li>


        </ul>
      </nav>

      
      <div class="logout">
        <a @click="logout">Logout</a>
      </div>
    </aside>

    <main class="main-content">
      <div class="header">
        <h1>{{ pages }}</h1>
      </div>
      <div class="content">
        
        <Nuxt />
        <!-- <pre>{{ data }}</pre> -->
      </div>
    </main>
  </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Swal from 'sweetalert2'
import firebase from '~/plugins/firebase.js'
export default {
  computed: {
    ...mapState('user', ['pages'])
  },

  data() {
    return {
      data: []
    }
  },

  methods: {
    logout() {
      Swal.fire({
        title: 'คุณต้องการออกจากระบบใช่หรือไม่',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
      }).then((result) => {
        if (result.isConfirmed) {
          firebase.auth().signOut();
          this.$router.push('/login');
          Swal.fire(
            'ออกจากระบบสําเร็จ',
            'คุณได้ออกจากระบบแล้ว',
            'success'
          );
        }
      })
    }
  },

  mounted() {

    // ตรวจสอบสถานะการเข้าสู่ระบบ
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // ผู้ใช้ได้เข้าสู่ระบบแล้ว
        // console.log("User is logged in:", user.uid);

        const uid = user.uid;

        this.data = [];

        // ดึงข้อมูลจาก Firebase Realtime Database โดยใช้ uid ของผู้ใช้
        firebase.database().ref('users/' + uid).on('value', (snapshot) => {
          const userData = snapshot.val();
          // console.log(userData);

          this.data = userData;

          // ถ้าคุณต้องการทำอย่างอื่นกับข้อมูลที่ได้มา

        });


      } else {
        // ผู้ใช้ยังไม่ได้เข้าสู่ระบบ
        console.log("User is not logged in.");

        // ส่งผู้ใช้ไปยังหน้า Login
        this.$router.push('/login');
      }
    });


  }

}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background: #146799;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.admin-info {
  text-align: center;
}

.avatar {

  width: 80px;
  height: 80px;
  background-color: #ffffff;
  border-radius: 50%;
  margin: 0 auto 1rem auto;
}

.menu {
  margin-top: 2rem;
  padding: 0 2rem;
  position: relative;
  bottom: 100px;
}

.menu h3 {
  color: #ffffff;
  font-size: 1.0rem;
  margin-bottom: 1rem;
}

.menu ul {
  list-style-type: none;
  padding: 0;
}

.menu ul li {
  margin-bottom: 1rem;
}

.activemenu {
  /* border-left: 5px solid #ffffff; */
  transition: all 0.3s ease-in-out;
  font-size: 1.1rem;
}

.menu ul li a {
  text-decoration: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 2rem;
  height: 30px;
  transition: all 0.3s ease-in-out;
}

.menu ul li a:hover {
  font-size: 1.1rem;
  color: #000000;
  /* border-left: 5px solid #ffffff; */
  transition: all 0.3s ease-in-out;
}


.menu ul li a::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url('static/menubar/icon.png');
  background-size: contain;
  background-repeat: no-repeat;
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 0.5rem;
}

.logout a {
  text-decoration: none;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  right: 20px;

}

.logout a::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url('static/menubar/icon-logout.png');
  background-size: contain;
  background-repeat: no-repeat;
  margin-right: 0.5rem;
}


/* Main Content */
.main-content {
  flex: 1;
  background-color: #ffffff;
}

.header {
  background-color: #e3f2fd;
  padding: 1rem;
  border-bottom: 2px solid #90caf9;
}

.header h1 {
  margin: 0;
  color: #1a237e;
  font-size: 1.5rem;
}

.content {
  padding: 1rem;
}

.report-banner {
  background-color: #1e88e5;
  color: white;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>