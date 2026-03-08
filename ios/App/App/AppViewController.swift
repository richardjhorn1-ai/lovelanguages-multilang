import Capacitor

final class AppViewController: CAPBridgeViewController {
    override public func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginType(SignInWithApple.self)
    }
}
