import AuthenticationServices
import Capacitor
import Foundation
import UIKit

@objc(SignInWithApple)
public final class SignInWithApple: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SignInWithApple"
    public let jsName = "SignInWithApple"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var activeCallID: String?
    private var authorizationController: ASAuthorizationController?

    @objc func authorize(_ call: CAPPluginCall) {
        guard #available(iOS 13.0, *) else {
            call.unavailable("Sign in with Apple requires iOS 13 or later.")
            return
        }

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = requestedScopes(from: call)
        request.state = call.getString("state")
        request.nonce = call.getString("nonce")

        activeCallID = call.callbackId
        bridge?.saveCall(call)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        authorizationController = controller
        controller.performRequests()
    }

    private func requestedScopes(from call: CAPPluginCall) -> [ASAuthorization.Scope]? {
        guard let scopes = call.getString("scopes") else {
            return nil
        }

        var requested: [ASAuthorization.Scope] = []
        if scopes.contains("name") {
            requested.append(.fullName)
        }
        if scopes.contains("email") {
            requested.append(.email)
        }
        return requested.isEmpty ? nil : requested
    }

    private func activeCall() -> CAPPluginCall? {
        guard let callID = activeCallID else {
            return nil
        }
        return bridge?.savedCall(withID: callID)
    }

    private func finish(_ call: CAPPluginCall) {
        bridge?.releaseCall(call)
        activeCallID = nil
        authorizationController = nil
    }
}

@available(iOS 13.0, *)
extension SignInWithApple: ASAuthorizationControllerDelegate {
    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = activeCall() else {
            return
        }

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Apple did not return a valid Apple ID credential.")
            finish(call)
            return
        }

        guard
            let identityTokenData = credential.identityToken,
            let identityToken = String(data: identityTokenData, encoding: .utf8),
            !identityToken.isEmpty
        else {
            call.reject("Apple did not return an identity token.")
            finish(call)
            return
        }

        guard
            let authorizationCodeData = credential.authorizationCode,
            let authorizationCode = String(data: authorizationCodeData, encoding: .utf8),
            !authorizationCode.isEmpty
        else {
            call.reject("Apple did not return an authorization code.")
            finish(call)
            return
        }

        call.resolve([
            "response": [
                "user": credential.user,
                "email": credential.email,
                "givenName": credential.fullName?.givenName,
                "familyName": credential.fullName?.familyName,
                "identityToken": identityToken,
                "authorizationCode": authorizationCode
            ]
        ])
        finish(call)
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        guard let call = activeCall() else {
            return
        }
        call.reject(error.localizedDescription, nil, error)
        finish(call)
    }
}

@available(iOS 13.0, *)
extension SignInWithApple: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = bridge?.viewController?.view.window {
            return window
        }

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first(where: \.isKeyWindow) {
            return window
        }

        return ASPresentationAnchor()
    }
}
