import ExpoModulesCore

extension Data {
    func hexEncodedString() -> String {
        return map { String(format: "%02hhx", $0) }.joined()
    }
    var bytes: [UInt8] {
        return [UInt8](self)
    }
}

extension StringProtocol {
    var hexaData: Data { .init(hexa) }
    var hexaBytes: [UInt8] { .init(hexa) }
    private var hexa: UnfoldSequence<UInt8, Index> {
        sequence(state: startIndex) { startIndex in
            guard startIndex < self.endIndex else { return nil }
            let endIndex = self.index(startIndex, offsetBy: 2, limitedBy: self.endIndex) ?? self.endIndex
            defer { startIndex = endIndex }
            return UInt8(self[startIndex..<endIndex], radix: 16)
        }
    }
}

public class ExpoHardwareEcdsaModule: Module {
    private func getOrCreateKey(name: String) -> SecKey? {
        let access = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .privateKeyUsage,
            nil)!
        
        let query: [String: Any] = [kSecClass as String: kSecClassKey,
                                    kSecAttrApplicationTag as String: name,
                                    kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
                                    kSecReturnRef as String: true]
        var error: Unmanaged<CFError>?
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        if (status == errSecSuccess) {
            return (item as! SecKey)
        }
        
        let attributes: NSDictionary = [
            kSecAttrKeyType: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits: 256,
            kSecAttrTokenID: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs: [
                kSecAttrIsPermanent: true,
                kSecAttrApplicationTag: name.data(using: .utf8)!,
                kSecAttrAccessControl: access
            ]
        ]
        
        guard let privateKey = SecKeyCreateRandomKey(attributes, &error) else {
            return nil;
        }
        
        return privateKey
    }
    
    public func definition() -> ModuleDefinition {
        Name("ExpoHardwareEcdsa")
        
        AsyncFunction("getPublicKey") {(keyName: String) -> [UInt8]? in
            var error: Unmanaged<CFError>?
            
            guard let key = getOrCreateKey(name: keyName) else {
                return nil
            }
            
            guard let publicKey = SecKeyCopyPublicKey(key) else {
                return nil
            };
            
            guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) as Data? else {
                throw error!.takeRetainedValue() as Error
            }
            
            return [UInt8](publicKeyData)
        }
        
        AsyncFunction("sign") { (keyName: String, data: [UInt8]) -> [UInt8]? in
            let algorithm: SecKeyAlgorithm = .ecdsaSignatureDigestX962
            var error: Unmanaged<CFError>?

            guard let key = getOrCreateKey(name: keyName) else {
                return nil
            }
            
            guard let signature = SecKeyCreateSignature(key,
                                                        algorithm,
                                                        Data(data) as CFData,
                                                        &error) as Data? else {
                throw error!.takeRetainedValue() as Error
            }
            
            return [UInt8](signature)
        }
    }
}
