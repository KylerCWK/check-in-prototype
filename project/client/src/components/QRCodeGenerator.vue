<template>
  <div>
    <NavBar />
    <div class="qrcode-section">
      <h1>QR Code Generator</h1>
      <input v-model="inputValue" class="input-field" placeholder="Enter text or URL" @input="generateQRCode" />
      <canvas ref="qrcode"></canvas>
      <button class="btn_primary" @click="downloadQRCode">Download QR Code</button>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import QRCode from "qrcode";

export default {
  name: 'QRCodeGenerator',
  components: { NavBar },
  data() {
    return {
      inputValue: ''
    };
  },
  methods: {
    generateQRCode() {
      QRCode.toCanvas(
        this.$refs.qrcode,
        this.inputValue || ' ',
        {
          width: 128,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H"
        },
        function (error) {
          if (error) {
            console.error(error);
          }
        }
      );
    },
    downloadQRCode() {
      const canvas = this.$refs.qrcode;
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  },
  mounted() {
    this.generateQRCode();
  }
};
</script>

<style scoped>
.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: white;
  padding: 2rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  max-width: 500px;
  margin: auto;
}

h1 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

canvas {
  margin-top: 10px;
}
</style>
