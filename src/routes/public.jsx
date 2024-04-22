import SignInSignUp from '@/components/features/login/page';
import { Route } from 'react-router-dom';

const PublicRoutes = () => {
    return (
        <>
            <Route exact path="/" component={SignInSignUp} />
        </>
    );
};

export default PublicRoutes;