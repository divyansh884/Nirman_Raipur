const mongoose= require("mongoose");

const citySchema= new mongoose.Schema(
    {
        cityName:{
            type:String,
            unique:true,
            trim:true,
            required:true
        }
    }

);

module.exports = mongoose.model("City", citySchema);