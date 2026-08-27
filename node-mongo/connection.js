import mongoose from 'mongoose';
const connectDB = async (URL)=>{
    try{
        const connect = await mongoose.connect(URL)
        return connect
    }catch(error){
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
    
}

export default connectDB;