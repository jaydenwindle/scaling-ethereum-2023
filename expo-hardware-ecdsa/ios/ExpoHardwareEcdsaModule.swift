import ExpoModulesCore

extension Data {
    func hexEncodedString() -> String {
        return map { String(format: "%02hhx", $0) }.joined()
    }
    var bytes: [UInt8] {
        return [UInt8](self)
    }
}

public class ExpoHardwareEcdsaModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
    
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
      var key: SecKey
      var item: CFTypeRef?
      let status = SecItemCopyMatching(query as CFDictionary, &item)
      if (status == errSecSuccess) {
          key = item as! SecKey
      } else {
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
          key = privateKey;
      }
      
      return key
  }
    
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoHardwareEcdsa')` in JavaScript.
    Name("ExpoHardwareEcdsa")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello from the native side! 👋"
    }

    AsyncFunction("generateKey") { (name: String) -> [UInt8]? in
        let algorithm: SecKeyAlgorithm = .ecdsaSignatureMessageX962SHA256
        var error: Unmanaged<CFError>?

        let key = getOrCreateKey(name: name) ?? nil
        
        if (key != nil) {
            guard let signature = SecKeyCreateSignature(key!,
                                                        algorithm,
                                                        "hello world".data(using: .utf8)! as CFData,
                                                        &error) as Data? else {
                throw error!.takeRetainedValue() as Error
            }
            
            let publicKey = SecKeyCopyPublicKey(key!);
            
            if (publicKey != nil) {
                guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey!, &error) as Data? else {
                    throw error!.takeRetainedValue() as Error
                }
                
                print(publicKeyData.bytes);
                print(signature.bytes);
                
                return publicKeyData.bytes
            }
        }
        
        return nil
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
