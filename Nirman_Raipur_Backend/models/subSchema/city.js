const mongoose= require("mongoose");

const citySchema= new mongoose.Schema(
    {
        name:{
            type:String,
            unique:true,
            trim:true,
            required:true
        }
    }

);

module.exports = mongoose.model("City", citySchema);