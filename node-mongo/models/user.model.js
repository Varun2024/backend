import {Schema, model} from 'mongoose';

const userSchema = new Schema({
    name:{
        type:String,
        required:true // mongodb doesnt require this but mongoose does , hence a definition is given by mongoose to nosql databases
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    salt:{
        type:String,
        required:true
    }
}, {timestamps:true})

const User = model('User', userSchema);
export default User;