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

//Let's add some basic styles later
<style scoped>
h1 {
    color: #333;
}
input {
    margin-bottom: 10px;
    padding: 5px;
    width: 250px;
}
</style>
