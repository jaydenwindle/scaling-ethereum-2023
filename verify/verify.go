package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
    "math/big"
	"fmt"
)

func main() {
    publicKeyRaw := []uint8{4, 113, 199, 169, 203, 218, 177, 224, 14, 137, 37, 115, 9, 118, 246, 162, 53, 254, 199, 251, 198, 164, 79, 73, 141, 120, 85, 142, 165, 9, 43, 48, 224, 217, 176, 57, 85, 162, 23, 131, 231, 8, 185, 176, 95, 130, 176, 109, 187, 89, 178, 16, 188, 49, 140, 197, 57, 190, 91, 68, 180, 120, 90, 114, 133}
    signatureRaw := []uint8{48, 69, 2, 32, 109, 101, 175, 130, 212, 177, 192, 182, 52, 186, 215, 116, 210, 70, 226, 22, 46, 59, 157, 13, 111, 183, 187, 67, 192, 198, 30, 167, 3, 194, 214, 29, 2, 33, 0, 188, 102, 228, 248, 206, 227, 159, 62, 154, 125, 63, 68, 24, 151, 20, 110, 28, 134, 127, 85, 229, 45, 225, 45, 17, 43, 176, 180, 140, 112, 157, 139}

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

    msg := "hello world"
	hash := sha256.Sum256([]byte(msg))

    valid := ecdsa.VerifyASN1(&publicKey, hash[:], signatureRaw)

    fmt.Println("valid", valid)
}
