package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	// "crypto/sha256"
    "encoding/asn1"
    "math/big"
	"fmt"
    "encoding/hex"
)

func main() {
    hashRaw := []uint8{71, 23, 50, 133, 168, 215, 52, 30, 94, 151, 47, 198, 119, 40, 99, 132, 248, 2, 248, 239, 66, 165, 236, 95, 3, 187, 250, 37, 76, 176, 31, 173}
    publicKeyRaw := []uint8{4, 62, 218, 33, 191, 54, 173, 239, 221, 126, 249, 193, 184, 222, 170, 59, 80, 181, 18, 20, 55, 56, 53, 129, 134, 178, 111, 156, 49, 17, 197, 187, 81, 111, 102, 102, 143, 28, 42, 61, 64, 225, 213, 200, 105, 160, 34, 8, 26, 233, 31, 118, 128, 102, 142, 224, 113, 16, 11, 18, 33, 89, 116, 130, 56}
    signatureRaw := []uint8{48, 69, 2, 32, 87, 240, 120, 210, 209, 218, 217, 38, 93, 136, 128, 91, 225, 175, 85, 66, 223, 43, 197, 39, 148, 67, 226, 204, 206, 62, 145, 235, 179, 169, 69, 47, 2, 33, 0, 213, 64, 254, 81, 188, 210, 153, 156, 188, 143, 255, 122, 36, 108, 50, 55, 71, 114, 7, 171, 227, 100, 96, 31, 101, 14, 145, 102, 78, 130, 34, 184}


    xSlice := publicKeyRaw[1:33]
    ySlice := publicKeyRaw[33:]

    fmt.Println(xSlice, len(xSlice));
    fmt.Println(ySlice, len(ySlice));

    publicKeyX := new(big.Int)
    publicKeyX.SetBytes(xSlice)
    publicKeyY := new(big.Int)
    publicKeyY.SetBytes(ySlice)

    publicKey := ecdsa.PublicKey{
        elliptic.P256(),
        publicKeyX,
        publicKeyY,
    }

    fmt.Println(publicKey)

    // msg := "hello world"
	// hash := sha256.Sum256([]byte(msg))

    type ECDSASignature struct {
		R, S *big.Int
	}

    ecdsaSig := &ECDSASignature{}

    asn1.Unmarshal(signatureRaw, ecdsaSig)

    fmt.Println("hash: ", hex.EncodeToString(hashRaw[:]))
    fmt.Println("X: ", publicKey.X)
    fmt.Println("Y: ", publicKey.Y)
    fmt.Println("R: ", ecdsaSig.R)
    fmt.Println("S: ", ecdsaSig.S)

    valid := ecdsa.VerifyASN1(&publicKey, hashRaw[:], signatureRaw)

    fmt.Println("valid", valid)
}
