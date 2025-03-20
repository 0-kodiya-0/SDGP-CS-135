import { Outlet } from "react-router-dom";
import AuthGuard from "../pages/AuthGuard";
import { AccountProvider } from "../features/default/user_account";

const ExampleWrapper = () => (
    <AuthGuard>
        <AccountProvider>
            <Outlet /> {/* This will render the nested routes */}
        </AccountProvider>
    </AuthGuard>
);

export default ExampleWrapper;