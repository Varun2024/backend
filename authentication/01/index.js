import express from "express";

const app = express();
const PORT = 8000;

app.use(express.json());

const DIARY = {};
const EMAILS = new Set();

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (EMAILS.has(email)) {
    res.status(400).json({ message: "Email already exists" });
  }

// create token for user
  const token = `${Date.now()}`;
// store user details in DIARY
  DIARY[token] = { name, email, password };
  EMAILS.add(email);
// 201- meaning client request succeeded and resource created successfully on the server
  return res.status(201).json({ message: "User created successfully", token });
});

app.post('/me',(req,res)=>{
    const {token} = req.body
    if(!token){
        return res.status(400).json({message:"Token is required"})
    }

    if(!(token in DIARY)){
        return res.status(400).json({message:"Invalid token"})
    }

    const entry = DIARY[token]
    return res.status(200).json({message:"User details fetched successfully",entry})
})

app.post('/private-data',(req,res)=>{
        const {token} = req.body
    if(!token){
        return res.status(400).json({message:"Token is required"})
    }

    if(!(token in DIARY)){
        return res.status(400).json({message:"Invalid token"})
    }
    const entry = DIARY[token]
    return res.json({data:"access granted to private data"})
})


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
