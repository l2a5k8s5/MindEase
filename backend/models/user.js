import mongoose from "mongoose"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema=mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    middleName:{
        type:String,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        select:false,
        minlength: [8, "Password must be of at least 8 characters"],
    },
    dateOfBirth:{
        type:Date,
        required:true,
        default:Date.now,
    },
    gender:{
        type:String,
        required:true,
        enum: ["male", "female", "other"],

    },
    PhoneNumber:{
        type:Number,
        required:true,
        minlength:10
    },
    isVolunteer:{
        type:Boolean,
        default:false
    },
    surveyResponses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Survey'
    }],
    activityLogs:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'activityLog'
    }],
    volunteerChats:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'volunteerChat'
    }],
    aiChatHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'aiChatHistory'
    }],
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetPassword: {
        type: Number,
    },
    resetPasswordExpire: {
        type: Date,
    },
    resetPasswordAttempts: {
        type: Number,
        default: 0,
    },
    resetPasswordLock: {
        type: Date,
    },
    registerOtp: {
        type: Number,
    },
    registerOtpExpire: {
        type: Date,
    },
    registerOtpAttempts: {
        type: Number,
        default: 0,
    },
    registerOtpLockUntil: {
        type: Date,
    },
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
    },
},
{
    timestamps: true,
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    const salt= await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt);
    next();
})

userSchema.methods.generateToken=async function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE,
    });
}


userSchema.methods.matchPassword=async function(password){
    return await bcrypt.compare(password,this.password);
};

const User=mongoose.model("User",userSchema);

export default User;
