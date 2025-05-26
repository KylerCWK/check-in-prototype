<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <div class="dashboard-section">
      <!-- Total Sales Graph Placeholder -->
      <div class="dashboard-card graph-card">
        <h2>Total Subscriptions (Last 7 Days)</h2>
        <div class="graph-placeholder">[Total Subscriptions Graph]</div>
      </div>
    </div>

    <div class="dashboard-section">
      <!-- Paying vs Non-Paying Customers Pie Chart -->
      <div class="dashboard-card graph-card">
        <h2>Paying vs Non-Paying Customers</h2>
        <div class="graph-placeholder">[Paying vs Non-Paying Pie Chart]</div>
      </div>
    </div>

    <div class="dashboard-section pair-section">
      <!-- Orders and Revenue Pair -->
      <div class="dashboard-pair">
        <div class="pair-card">
          <h3>Total Orders</h3>
          <div class="graph-placeholder">[Orders Graph]</div>
          <div class="pair-stats">
            <span class="stat-label">Number:</span> <span class="stat-value">--</span>
            <span class="stat-label">% Change:</span> <span class="stat-value">--%</span>
          </div>
        </div>
        <div class="pair-card">
          <h3>Total Revenue</h3>
          <div class="graph-placeholder">[Revenue Graph]</div>
          <div class="pair-stats">
            <span class="stat-label">Amount:</span> <span class="stat-value">$--</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-section">
      <!-- New Customers Graph -->
      <div class="dashboard-card graph-card">
        <h2>New Customers (Last 7 Days)</h2>
        <div class="graph-placeholder">[New Customers Graph]</div>
        <div class="quad-stats">
          <span class="stat-label">% Change:</span> <span class="stat-value">--%</span>
        </div>
      </div>
    </div>

    <div class="dashboard-section coupon-section">
      <!--Top Coupons Pie Chart with Add Coupon -->
      <div class="dashboard-card coupon-card">
        <h2>Top Coupons (Last 7 Days)</h2>
        <div class="graph-placeholder">[Top Coupons Pie Chart]</div>
        <form class="add-coupon-form">
          <input type="text" placeholder="Coupon Code" class="input-field" />
          <input type="number" placeholder="Discount (%)" class="input-field" />
          <input type="date" placeholder="Expiration Date" class="input-field" />
          <button class="btn_primary" type="submit">Add Coupon</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  //In the future, fetch data from backend API here
};
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}
.dashboard-section {
  margin-bottom: 2rem;
}
.graph-card, .coupon-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.5rem 2rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  margin-bottom: 1rem;
}
.graph-placeholder {
  height: 180px;
  background: repeating-linear-gradient(135deg, #e0e0e0, #e0e0e0 10px, #f7f7f7 10px, #f7f7f7 20px);
  border-radius: 8px;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.1rem;
}
.pair-section {
  margin-bottom: 2rem;
}
.dashboard-pair {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: space-between;
}
.pair-card {
  flex: 1 1 300px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  margin-bottom: 1rem;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.pair-stats {
  margin-top: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.stat-label {
  font-weight: 500;
  color: #555;
  margin-right: 0.3rem;
}
.stat-value {
  font-weight: 700;
  color: #2c3e50;
}
.coupon-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.add-coupon-form {
  display: flex;
  gap: 1rem;
  margin-top: 1.2rem;
  flex-wrap: wrap;
}
.input-field {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 180px;
}
@media (max-width: 900px) {
  .dashboard-pair {
    flex-direction: column;
    gap: 1rem;
  }
  .admin-dashboard {
    padding: 1rem;
  }
}
</style>
