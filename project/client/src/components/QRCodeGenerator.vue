<template>
    <div>
        <h1>QR Code Generator</h1>
        <input v-model="inputValue" placeholder="Enter text or URL" @input="generateQRCode" />
        <canvas ref="qrcode"></canvas>
    </div>
</template>

<script>
import QRCode from "qrcode";

export default{
    name: 'QRCodeGenerator',
    data(){
        return{
            inputValue: ''
        };
    },

    methods:{
        generateQRCode(){
            QRCode.toCanvas(
                this.$refs.qrcode,
                this.inputValue || ' ', //blank if empty
                {
                    width: 128,
                    color:{
                        dark: "#000000",
                        light: "#ffffff"
                    },
                    errorCorrectionLevel: "H"
                },

                function (error){
                    if(error){
                        console.error(error);
                    }
                }
            );
        }
    },

    mounted(){
        this.generateQRCode();
    }
};
</script>

<style scoped>
body {
    margin: 0;
    font-family: Arial, sans-serif;
    background-color: #f7f7f7;
}

div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: white;
    padding: 2rem;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    max-width: 400px;
    margin: auto;
}

h1 {
    color: #2c3e50;
    font-size: 1.8rem;
    margin-bottom: 1rem;
}

input {
    margin-bottom: 20px;
    padding: 10px;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: border-color 0.3s ease;
}

input:focus {
    border-color: #42b983;
    outline: none;
}

canvas {
    margin-top: 10px;
}
</style>

