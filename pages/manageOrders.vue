<template>
    <div class="manage-orders-container">
        <h1>Manage Orders</h1>

        <div class="order-list container scrollable-content">
            <!-- Orders Loop -->
            <div v-for="(order, index) in orders" :key="index" class="order-item">
                <div class="order-details">
                    <p><strong>email: </strong> {{ order.email ? order.email : 'No email' }}</p>
                    <p><strong>Total photos: </strong> {{ order.order ? order.order.length : 0 }}</p>
                    <p><strong>Price photos:</strong> {{ order.selectedSubtotal }} THB</p>
                </div>

                <div class="order-details">
                    <p><strong>bank slip:</strong> {{ order.transfer && order.transfer.bank ? order.transfer.bank :
                        'N/A' }}</p>
                    <p><strong>name slip:</strong> {{ order.transfer && order.transfer.name ? order.transfer.name :
                        'N/A' }}</p>
                    <p><strong>date slip:</strong> {{ order.transfer && order.transfer.date ? order.transfer.date :
                        'N/A' }}</p>
                </div>

                <div class="order-action">
                    <button @click="showTransferSlip(order)">Transfer slip</button>
                    <p><strong>status:</strong> {{ order.status || 'N/A' }}</p>
                </div>
            </div>
        </div>

        <!-- Custom Loading Spinner -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>
    </div>
</template>

<script>
import Swal from 'sweetalert2';
import firebase from '~/plugins/firebase.js';

export default {
    layout: 'MenuBar',

    async asyncData({ store }) {
        const page = 'manageOrders';
        store.commit('user/setPages', page);
    },

    data() {
        return {
            orders: [],
            isLoading: false,
        };
    },

    mounted() {
        this.fetchOrders();
    },

    methods: {
        async fetchOrders() {
            try {
                // ใช้ 'on' แทน 'once' เพื่อฟังการเปลี่ยนแปลงข้อมูลแบบเรียลไทม์
                firebase.database().ref('payments').on('value', (snapshot) => {
                    this.orders = []; // เคลียร์ orders ก่อน
                    snapshot.forEach((childSnapshot) => {
                        const orderData = {
                            ...childSnapshot.val(),
                            id: childSnapshot.key,
                        };
                        this.orders.unshift(orderData); // เพิ่มข้อมูลใหม่ที่ดึงมาให้อยู่ที่ตำแหน่งแรก
                    });
                });
            } catch (error) {
                console.error(error);
            }
        },

        showTransferSlip(order) {
            Swal.fire({
                title: 'Transfer Slip',
                html: `
            <p><strong>Email:</strong> ${order.email ? order.email : 'No email'}</p>
            <p><strong>Total Photos:</strong> ${order.order ? order.order.length : 0}</p>
            <p><strong>Price Photos:</strong> ${order.selectedSubtotal} THB</p>
            <img src="${order.slipImageUrl}" alt="Order Slip" style="width: 100%; height: auto; margin-top: 10px;">
          `,
                showCancelButton: true,
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                preConfirm: () => this.confirmOrder(order)
            });
        },

        async confirmOrder(order) {
            try {
                Swal.fire({
                    title: 'Confirming order...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Update status carts
                for (const item of order.order) {
                    await firebase.database().ref('carts/' + item.id).update({
                        status: 'confirmation',
                    });
                }

                // Update status payments
                await firebase.database().ref('payments/' + order.id).update({
                    status: 'confirmation',
                });


                Swal.fire('Success!', 'Order confirmed successfully!', 'success');
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to confirm order: ${error.message}`,
                    confirmButtonText: 'OK',
                });
            }
        },
    },
};
</script>
<style scoped>
.manage-orders-container {
    max-width: auto;
    margin: 0 auto;
}

.order-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e0e0e0;
    padding: 20px 0;
}

.order-details {
    flex: 1;
    padding: 0 20px;
}

.order-action button {
    padding: 8px 16px;
    background-color: #166798;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
}

.order-action button:hover {
    background-color: #0056b3;
}

.modal-overlay {
    position: fixed;
    left: 30%;
    top: 25%;
    width: 50vw;
    height: 50vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}

.modal-actions {
    margin-top: 20px;
}

.modal-actions button {
    padding: 8px 16px;
    margin: 0 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.cancel-button {
    background-color: #d9534f;
    color: white;
}

.confirm-button {
    background-color: #5cb85c;
    color: white;
}

.scrollable-content {
    width: 100%;
    height: 80vh;
    overflow-y: scroll;
    overflow-x: hidden;
    padding: 10px;
}

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

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loading-spinner {
    border: 16px solid #f3f3f3;
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 120px;
    height: 120px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>