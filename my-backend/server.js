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
  // ★ 修改 1: 多接收一個 newPassword 參數
  const { email, verifyKey, newPassword } = req.body;

  // ★ 修改 2: 檢查有沒有傳密碼來
  if (!email || !verifyKey || !newPassword) {
    return res.status(400).json({ success: false, message: "資料不完整" });
  }
  
  // ★ 修改 3: 簡單檢查密碼長度
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "新密碼至少需要 6 位數" });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    const doc = await admin.firestore().collection("users").doc(uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "找不到使用者資料" });
    }

    const userData = doc.data();
    if (userData.lineUserId !== verifyKey) {
      return res.status(403).json({ success: false, message: "驗證碼 (LINE ID) 錯誤！" });
    }

    // ★ 修改 4: 使用 user 傳來的密碼
    await admin.auth().updateUser(uid, {
      password: newPassword 
    });

    return res.json({ success: true, message: "驗證成功！密碼已更新。" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "系統錯誤: " + error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
