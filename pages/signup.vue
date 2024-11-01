<template>
  <div>
    <!-- Navbar Component -->
    <!-- <Navbar /> -->

    <div class="signup-page">
      <div class="image-section"></div>
      <div class="signup-container">
        <div class="auth-header">
            <nuxt-link to="/login" class="auth-link">SIGN IN</nuxt-link>
            <nuxt-link to="/signup" class="auth-link1 active">REGISTER</nuxt-link>
        </div>
  
        <h2 class="welcome-text">Welcome Block</h2>
  
        <form @submit.prevent="handleSubmit">
          <div class="input-group">
            <input
              type="text"
              id="username"
              v-model="username"
              placeholder="Username"
              class="input-field"
              required
            />
          </div>
  
          <div class="input-group">
            <input
              type="tel"
              id="phone"
              v-model="phone"
              placeholder="Phone"
              class="input-field"
              required
            />
          </div>
  
          <div class="input-group">
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="Email"
              class="input-field"
              required
            />
          </div>
  
          <div class="input-group">
            <input
              type="password"
              id="password"
              v-model="password"
              placeholder="Password"
              class="input-field"
              required
            />
          </div>
  
          <div class="input-group">
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm Password"
              class="input-field"
              required
            />
          </div>
  
          <button type="submit" class="signup-button">SIGN UP</button>
        </form>
      </div>
    </div>
  </div>
  </template>
  
  <script>
  import firebase from '~/plugins/firebase.js'
  import Swal from 'sweetalert2'
  export default {
    data() {
      return {
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
    },
    methods: {
      handleSubmit() {
        if (this.password !== this.confirmPassword) {
          alert("Passwords do not match");
          return;
        }
        firebase
          .auth()
          .createUserWithEmailAndPassword(this.email, this.password)
          .then((user) => {
            this.setUserData(user.user.uid);
          })
          .catch((error) => {
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Account already exists",
              showConfirmButton: false,
              timer: 1500
            });
          });
      },
      setUserData(uid) {
        firebase
          .database()
          .ref('users/' + uid)
          .set({
            username: this.username,
            phone: this.phone,
            email: this.email,
            uid: uid
          })
          .then(() => {
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Registration successful",
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.$router.push('/home');
            });
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .signup-page {
    display: flex;
    height: 100vh;
  }
  
  .image-section {
    flex: 1;
    background-image: url('../static/login/bg.png');
    background-size: cover;
    background-position: center;
  }
  
  .signup-container {
    flex: 0.7;
    padding: 5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: start;
    background-color: white;
  }
  
  .auth-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  
  .auth-link {
    text-decoration: none;
    font-size: 1rem;
    position: relative;
    right: -50px;
    color: #000;
    position: relative;
  }

  .auth-link1 {
    text-decoration: none;
    font-size: 1rem;
    position: relative;
    right: 50px;
    color: #000;
    position: relative;
  }
  
  .auth-link1.active::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #1e88e5;
    bottom: -5px;
    left: 0;
  }
  
  .auth-link:hover {
    color: #1e88e5;
  }
  
  .welcome-text {
    padding-top: 2rem;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
    color: #000;
  }
  
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .input-field {
    width: 100%;
    height: 2.5rem;
    padding: 1rem;
    /* border-radius: 5px; */
    border: 1px solid #A6A6A6;
    font-size: 1rem;
    color: #000;
  }
  
  .input-field::placeholder {
    color: #bdbdbd;
  }
  
  .signup-button {
    width: 100%;
    height: 2.5rem;
    /* border-radius: 5px; */
    border: none;
    background-color: #146799;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
  }
  
  .signup-button:hover {
    background-color: #327ab9;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .signup-page {
      flex-direction: column;
    }
  
    .image-section {
      display: none;
    }
  
    .signup-container {
      width: 100%;
      padding: 1.5rem;
    }
  
    .auth-link {
      font-size: 0.9rem;
    }
  
    .welcome-text {
      font-size: 1.2rem;
    }
  
    .input-field {
      height: 2rem;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  
    button {
      height: 2rem;
      font-size: 0.9rem;
    }
  }
  </style>
  