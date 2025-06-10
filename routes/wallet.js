const express = require('express');
const router = express.Router();
const lightwallet = require('eth-lightwallet');
const fs = require('fs'); // ✅ 파일 시스템 모듈 불러오기
const path = require('path'); // (선택) 저장 경로 설정용


router.post('/newMnemonic', async (req, res) => {
    try {
      const mnemonic = lightwallet.keystore.generateRandomSeed();
      res.json({ mnemonic });
    } catch (error) {
      res.status(500).json({ error: 'Mnemonic 생성 실패', details: error.message });
    }
  });
  

router.post('/newWallet', async (req, res) => {
  const password = req.body.password;
  const mnemonic = req.body.mnemonic;

  if (!password || !mnemonic) {
    return res.status(400).json({ code: 400, message: "password와 mnemonic이 필요합니다." });
  }

  try {
    lightwallet.keystore.createVault({
      password,
      seedPhrase: mnemonic,
      hdPathString: "m/0'/0'/0'"
    }, (err, ks) => {
      if (err) {
        return res.status(500).json({ code: 500, message: "Vault 생성 실패", details: err.message });
      }

      ks.keyFromPassword(password, (err, pwDerivedKey) => {
        if (err) {
          return res.status(500).json({ code: 500, message: "pwDerivedKey 생성 실패", details: err.message });
        }

        ks.generateNewAddress(pwDerivedKey, 1);

        const address = ks.getAddresses()[0];
        const keystore = ks.serialize();

        // 📁 저장 경로 설정 (프로젝트 내 keystores 폴더를 추천)
        const filePath = path.join(__dirname, `../keystores/${address}.json`);

        // 📄 파일 저장
        fs.writeFile(filePath, keystore, (err) => {
          if (err) {
            return res.status(500).json({ code: 999, message: "파일 저장 실패", details: err.message });
          }
          return res.json({ code: 1, message: "성공", address });
        });
      });
    });
  } catch (exception) {
    console.error("NewWallet ==>>>>", exception);
    return res.status(500).json({ code: 999, message: "예외 발생", details: exception.message });
  }
});

module.exports = router;
