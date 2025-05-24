<template>
  <div>
    <h1>QR Code Generator</h1>
    <canvas id="qrcode"></canvas>
  </div>

</template>

<script>
import QRCode from "qrcode";

export default {
  name: 'QRCodeGenerator',
  mounted() {
    QRCode.toCanvas(
      document.getElementById("qrcode"),
      "https://www.pizzahut.com/", //You should be able to change this to any URL
      {
        width: 128,
        color: {
          dark: "#000000",
          light: "#ffffff"
        },
        errorCorrectionLevel: "H"
      },
      function (error) {
        if (error) console.error(error);
      }
    );
  }
};
</script>

<style scoped>
h1 {
  color: #333;
}
</style>
