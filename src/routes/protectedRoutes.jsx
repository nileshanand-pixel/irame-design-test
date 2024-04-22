import Dashboard from '@/components/features/dashboard/page';
import Help from '@/components/features/help/page';
import NewChat from '@/components/features/new-chat/page';
import Settings from '@/components/features/settings/page';
import { Route } from 'react-router-dom';


const ProtectedRoutes = () => {
    return (
        <>
            <Route path="/new-chat" component={NewChat} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/help" component={Help} />
        </>
    );
};

export default ProtectedRoutes;