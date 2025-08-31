const mongoose= require("mongoose");

const workDeptSchema= new mongoose.Schema(
    {
        name:{
            type:String,
            unique:true,
            trim:true,
            required:true
        }
    }

);

module.exports = mongoose.model("WorkDept", workDeptSchema);