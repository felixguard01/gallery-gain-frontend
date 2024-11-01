<template>
  <div>
    <!-- Navbar Component -->
    <Navbar />

    <!-- Shopping Cart Section -->
    <div class="cart-page">
      <div class="cart-container">
        <h2 class="cart-title">Shopping Cart</h2>
        <div class="row">
          <div class="col">
            <div class="cart-header">
              <p>Items selected for purchase: {{ selectedItems.length }}</p>
            </div>
          </div>
          <div class="col">
            <!-- Status Filter -->
            <div class="filter-container">
              <label for="statusFilter" class="filter-label">Filter by Status:</label>
              <select v-model="statusFilter" id="statusFilter" class="filter-select">
                <option value="">All</option>
                <option value="Not paid">Not paid</option>
                <option value="Waiting confirmation">Waiting confirmation</option>
                <option value="Confirmation">Confirmation</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="loading-container">
          <div class="spinner-border text-warning" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>

        <div v-else class="scrollable-content">
          <!-- Cart Items List -->
          <div v-for="(item, index) in filteredItems" :key="index" class="cart-item">
            <div class="image-container">
              <img :src="item.image" alt="item image" class="item-image" />
              <div class="watermark">{{ item.mediaWatermark }}</div>
            </div>
            <div class="item-details">
              <p><strong>Media type:</strong> {{ item.mediaType }}</p>
              <p><strong>License type:</strong> <a href="#">{{ item.licenseType }}</a></p>
              <p><strong>Price:</strong> {{ item.price }} THB</p>
              <div class="row">
                <div class="col-7">
                  <p :class="statusClass(item.status)" class="item-status">
                    Status: {{ item.status }}
                  </p>
                </div>
                <div class="col">
                  <button v-if="item.status === 'confirmation'" class="download-button" @click="downloadItem(item)">
                    Download
                  </button>
                </div>
              </div>
              <button class="remove-button" @click="removeItem(item)">Remove</button>
            </div>
            <input type="checkbox" v-model="item.selected" class="select-item-checkbox" />
          </div>
        </div>
      </div>

      <!-- Payment Section -->
      <div class="payment-container">
        <h3 class="payment-title">Payment channels</h3>
        <div class="row">
          <div class="col">
            <img src="../static/cart/qrcodefe.jpg" alt="QR Code" class="qr-code" />
          </div>
          <div class="col">
            <div class="payment-details">
              <input type="text" placeholder="Name" v-model="payment.name" class="input-field" disabled />
              <input type="text" placeholder="Bank" v-model="payment.bank" class="input-field" disabled />
              <input type="text" placeholder="XXX-XXXX-XXX" v-model="payment.accountNumber" class="input-field"
                disabled />
            </div>
          </div>
        </div>

        <h3 class="payment-title">Transfer slip</h3>
        <input type="file" @change="handleFileUpload" class="file-input" />
        <img v-if="slipImageUrl" :src="slipImageUrl" alt="slip preview" class="slip-preview" />
        <div class="transfer-details">
          <div class="row">
            <div class="col">
              <input type="text" placeholder="Name" v-model="transfer.name" class="input-field" />
            </div>
            <div class="col">
              <input type="text" placeholder="Bank" v-model="transfer.bank" class="input-field" />
            </div>
            <div class="col">
              <input type="text" placeholder="Date" v-model="transfer.date" class="input-field" />
            </div>
          </div>
        </div>
        <div class="subtotal-container">
          <p class="subtotal-text">Subtotal: {{ selectedSubtotal }} THB</p>
          <button @click="processPayment" class="pay-button">Pay</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';

export default {
  data() {
    return {
      statusFilter: '',
      cartItems: [],
      payment: {
        name: 'กาจน์ พงศ์พิริยะสกุล',
        bank: 'กสิกรไทย',
        accountNumber: '091-3-08365-2',
      },
      transfer: {
        name: '',
        date: '',
        bank: '',
      },
      slipImageUrl: '',
      file: null,
      loading: false,
      uid: '',
      email: '',
    };
  },

  async mounted() {
    try {
      const user = await new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          } else {
            reject('No user is signed in');
          }
        });
      });

      if (user.multiFactor) {
        this.email = user.multiFactor.user.email;
        this.uid = user.multiFactor.user.uid;
        await this.fetchCartItems(this.uid);
      } else {
        console.error("User does not have multiFactor information.");
      }
    } catch (error) {
      console.error("Error fetching user or cart items:", error);
    }
  },

  computed: {
    filteredItems() {
      if (this.statusFilter) {
        return this.cartItems.filter((item) => item.status === this.statusFilter);
      }
      return this.cartItems;
    },

    selectedItems() {
      return this.cartItems
        .filter((item) => item.selected)
        .map((item) => ({
          ...item,
          status: 'Waiting confirmation',
        }));
    },

    selectedSubtotal() {
      return this.selectedItems.reduce((total, item) => total + parseFloat(item.price), 0);
    },
  },

  methods: {
    async fetchCartItems(uid) {
      this.loading = true;

      await firebase.database().ref('carts').on('value', (snapshot) => {
        if (!uid) {
          Swal.fire('Warning', 'User ID is missing', 'warning');
          return;
        }

        this.cartItems = [];
        const data = snapshot.val();

        // ตรวจสอบว่า data ไม่เป็น null หรือ undefined ก่อน
        if (data) {
          Object.entries(data).forEach(([cartid, item]) => {
            if (item.userId === uid) {
              firebase.database().ref('photos/' + item.Image).once('value', (snapshot) => {
                const imageData = snapshot.val();
                this.cartItems.push({
                  image: imageData.imagePreview,
                  mediaType: imageData.mediaType,
                  licenseType: imageData.mediaLicense,
                  price: imageData.mediaPrice,
                  status: item.status || 'Not paid',
                  selected: false,
                  id: cartid,
                  mediaWatermark: imageData.mediaWatermark,
                });
              });
            }
          });
        } else {
          console.warn('No cart data found.');
        }

        this.loading = false;
      });
    },


    handleFileUpload(event) {
      const file = event.target.files[0];
      this.file = file;
      this.slipImageUrl = URL.createObjectURL(file);
    },

    async UpdatedselectedItems() {
      this.selectedItems.forEach((item) => {
        firebase.database().ref('carts/' + item.id).update({
          status: 'Waiting confirmation'
        })
      })
    },

    async uploadSlipAndSavePayment() {
      if (!this.file) {
        Swal.fire('Error', 'Please select an image to upload.', 'error');
        return;
      }

      try {
        this.loading = true;

        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`slips/${this.file.name}`);
        const snapshot = await fileRef.put(this.file);
        const downloadURL = await snapshot.ref.getDownloadURL();

        this.slipImageUrl = downloadURL;
        await this.UpdatedselectedItems()

        if (this.selectedItems && this.selectedItems.length > 0) {
          const Payment = {
            transfer: this.transfer,
            selectedSubtotal: this.selectedSubtotal,
            slipImageUrl: this.slipImageUrl,
            order: this.selectedItems,
            uid: this.uid,
            email: this.email,
            status: 'Waiting confirmation'
          };

          if (!Payment.transfer || !Payment.order || !Payment.uid) {
            Swal.fire('Error', 'Please fill in all required fields.', 'error');
            return;
          }

          await firebase.database().ref('payments').push(Payment);

          this.transfer = {};
          this.selectedItems = [];
          this.slipImageUrl = null;

          Swal.fire('Success', 'Payment processed successfully!', 'success');
        } else {
          Swal.fire('Error', 'No items selected.', 'error');
        }



      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    processPayment() {
      if (!this.transfer.name || !this.transfer.bank || !this.transfer.date) {
        Swal.fire({
          title: 'Error!',
          text: 'Please fill in all required fields.',
          icon: 'error',
        });
        return;
      }

      this.uploadSlipAndSavePayment();
    },

    async downloadItem(item) {
      try {
        const storageRef = firebase.storage().refFromURL(item.image);
        const downloadURL = await storageRef.getDownloadURL();
        window.open(downloadURL, '_blank');
      } catch (error) {
        Swal.fire('Error', 'Failed to download file. Please try again later.', 'error');
      }
    },

    removeItem(item) {
      this.cartItems = this.cartItems.filter((i) => i !== item);
    },
    statusClass(status) {
      if (status === 'Not paid') return 'not-paid';
      if (status === 'Waiting confirmation') return 'waiting-confirmation';
      return 'confirmation';
    },
  },
};
</script>


<style scoped>
/* Overall Layout */
.cart-page {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  font-family: Arial, sans-serif;
}

/* Filter */
.filter-container {
  margin-bottom: 1.5rem;
}

.filter-label {
  font-weight: bold;
  margin-right: 1rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

/* Cart Section */
.cart-container {
  flex: 2;
}

.cart-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.cart-header {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;

}

.cart-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* Scrollable content */
.scrollable-content {
  width: 100%;
  height: 66.5vh;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 10px;
}

/* Custom scrollbar */
.scrollable-content::-webkit-scrollbar {
  width: 8px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background-color: #ffffff;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background-color: #ffffff;
}

.image-container {
  position: relative;
}

.item-image {
  width: 150px;
  height: 100px;
  margin-right: 1rem;
  object-fit: cover;
  border-radius: 5px;
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
  /* เพิ่มเงาเพื่อให้เห็นชัด */
}


.item-image {
  width: 150px;
  height: 100px;
  margin-right: 1rem;
  object-fit: cover;
  border-radius: 5px;
}

.item-details {
  flex-grow: 1;
}

.item-details p {
  margin: 0.25rem 0;
}

.item-status {
  margin-top: 0.5rem;
  font-weight: bold;
}

.download-button {
  margin-left: 1rem;
  cursor: pointer;
  height: 30px;
  width: auto;
  background-color: #0f6e43;
  color: white;
  border: none;
  border-radius: 5px;
}

.remove-button {
  margin-left: 1rem;
  cursor: pointer;
  height: 30px;
  width: auto;
  background-color: #3f3f3f;
  color: white;
  border: none;
  border-radius: 5px;
}

.download-button:hover {
  background-color: #647b70;
}

.select-item-checkbox {
  margin-left: 1rem;
  cursor: pointer;
  height: 20px;
  width: 20px;
}

.not-paid {
  color: red;
}

.waiting-confirmation {
  color: orange;
}

.confirmation {
  color: green;
}

/* Payment Section */
.payment-container {
  flex: 1;
  background-color: #ABC4D4;
  padding: 1rem;
  border-radius: 10px;
}

.payment-title {
  font-size: 1.5rem;
  /* margin-bottom: 1rem; */
  color: #166798;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin-bottom: 1.5rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.file-input {
  margin-bottom: 1rem;
}

.slip-preview {
  width: 200px;
  height: 200px;
  margin-top: 1rem;
  object-fit: cover;
  border-radius: 5px;
}

.subtotal-container {
  margin-top: 2rem;
}

.subtotal-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #166798;
}

.pay-button {
  /* margin-top: 1rem; */
  padding: 0.75rem 1.5rem;
  background-color: #166798;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
}

.pay-button:hover {
  background-color: #0f4b6e;
}
</style>