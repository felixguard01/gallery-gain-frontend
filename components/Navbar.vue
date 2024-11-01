<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo aligned to the left -->
      <div class="logo">
        <nuxt-link to="/">Gallery Gain</nuxt-link>
      </div>

      <!-- Hamburger menu for mobile -->
      <div class="menu-toggle" @click="toggleMenu">
        ☰
      </div>

      <!-- Navigation links aligned to the right -->
      <div :class="['nav-links', { 'nav-active': isMenuOpen }]">
        <nuxt-link to="/home">Home</nuxt-link>
        <nuxt-link to="/board">Board</nuxt-link>
        <nuxt-link to="/cart">Cart</nuxt-link>
        <nuxt-link v-if="data === 'admin'" to="/addPhoto">Admin</nuxt-link>
        <nuxt-link v-if="uid === null" to="/login">Sign In</nuxt-link>
        <nuxt-link v-if="uid === null" to="/signup">Sign Up</nuxt-link>

        <!-- <pre> {{ data }}</pre> -->

        <button v-if="uid !== null" class="logout" @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';
export default {
  name: 'Navbar',
  data() {
    return {
      isMenuOpen: false, // State to control mobile menu
      email: null,
      uid: null,
      data: null
    };
  },
  async mounted() {
    try {
      // รอจนกว่าผู้ใช้จะถูกดึงมาได้อย่างสมบูรณ์
      const user = await new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            unsubscribe(); // ยกเลิกการสมัครเมื่อได้ข้อมูลผู้ใช้แล้ว
            resolve(user);
          } else {
            reject('No user is signed in');
          }
        });
      });


      // ตรวจสอบว่ามี multiFactor ก่อนเข้าถึง uid
      if (user.multiFactor) {
        this.email = user.multiFactor.user.email;
        // console.log("User email:", this.email);
        this.uid = user.multiFactor.user.uid;
        this.getuser(this.uid);
        // console.log("User UID:", this.uid);

      } else {
        console.error("User does not have multiFactor information.");
      }
    } catch (error) {
      console.error("Error fetching user or cart items:", error);
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
    },

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen; // Toggle the menu visibility
    },

    getuser(uid) {
      firebase.database().ref('users/' + uid).on('value', (snapshot) => {
        const data = snapshot.val();
        this.data = data.admin;
        // console.log(data.admin);
      })
    }
  },
};
</script>

<style scoped>
.logout {
  background-color: #146799;
  border: none;
  color: rgb(255, 255, 255);
  padding: 3px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  /* margin: 4px 2px; */
  cursor: pointer;
  border-radius: 10px;
}

/* Style for the Navbar */
.navbar {
  background-color: #ffffff;
  padding: 1rem;
  width: 100%;
  /* Ensure the navbar spans full width */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Flex container for logo and links */
.navbar-container {
  display: flex;
  justify-content: space-between;
  /* Ensure logo on the left, links on the right */
  align-items: center;
  /* Vertically align logo and links */
  max-width: 1200px;
  margin: 0 auto;
  /* Center the navbar-container within the page */
  width: 100%;
  /* Ensure it stretches to full width */
}

/* Logo aligned to the left */
.logo a {
  color: #146799;
  font-size: 1.5rem;
  text-decoration: none;
  font-weight: bold;
}

/* Links aligned to the right */
.nav-links {
  display: flex;
  gap: 2rem;
  /* Add spacing between links */
}

.nav-links a {
  color: #000000;
  text-decoration: none;
  font-size: 1rem;
}

.nav-links a:hover {
  text-decoration: underline;
}

/* Hamburger menu button */
.menu-toggle {
  display: none;
  font-size: 2rem;
  color: #146799;
  cursor: pointer;
}

/* Mobile-specific styling */
@media (max-width: 768px) {
  .nav-links {
    display: none;
    /* Hide navigation links by default on mobile */
    flex-direction: column;
    /* Stack links vertically */
    position: absolute;
    top: 60px;
    right: 0;
    width: 100%;
    padding: 1rem;
    z-index: 100;
  }

  /* Display the links when the menu is open */
  .nav-active {
    display: flex;
  }

  .menu-toggle {
    display: block;
    /* Show hamburger menu on mobile */
  }

  .nav-links a {
    padding: 1rem 0;
    text-align: center;
    width: 100%;
  }
}
</style>
