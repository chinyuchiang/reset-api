const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true }));

// 從環境變數讀取金鑰
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post("/reset-password", async (req, res) => {
  const { email, verifyKey } = req.body;

  if (!email || !verifyKey) {
    return res.status(400).json({ success: false, message: "資料不完整" });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    const doc = await admin.firestore().collection("users").doc(uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "找不到使用者資料" });
    }

    const userData = doc.data();
    // 這裡比對 "lineUserId" 欄位，您可以改成比對您想要的欄位
    if (userData.lineUserId !== verifyKey) {
      return res.status(403).json({ success: false, message: "驗證碼錯誤！" });
    }

    await admin.auth().updateUser(uid, {
      password: "123456" 
    });

    return res.json({ success: true, message: "驗證成功！密碼已重設為 123456" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "系統錯誤: " + error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});