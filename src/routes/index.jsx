import { Navigate, Route, Routes } from 'react-router-dom';
import SignInSignUp from '@/components/features/login/page';
import NewChat from '@/components/features/new-chat/page';
import Dashboard from '@/components/features/dashboard/page';
import Help from '@/components/features/help/page';
import Layout from '@/components/Layout';
import Configuration from '@/components/features/configuration/page';
import Workzone from '@/components/features/new-chat/session/Page';
import DashboardDetailsPage from '@/components/features/dashboard/components/DashboardDetailsPage';
import TestRoute from '@/components/features/testingUI/Page';
import ProtectedRoute from './ProtectedRoute';
import DataSource from '@/components/features/configuration/datasource/page';
import ReportsInDatasource from '@/components/features/reports/datasource_reports/Page';
import ReportFolders from '@/components/features/reports/Page';
import TermsModal from '@/components/TermsModal';
import BusinessProcessPage from '@/components/features/business-process/page';
import WorkflowPage from '@/components/features/business-process/workflow/page';
import SingleBusinessProcessPage from '@/components/features/business-process/single-business-process/SingleBusinessProcess';


const AppRoutes = () => {
	return (
		<>
			<TermsModal />
			<Routes>
				<Route exact path="/*" element={<SignInSignUp />} />
				<Route
					path="/app/*"
					element={
						<Layout>
							<Routes>
								<Route
									path="/"
									element={<Navigate to="new-chat" />}
								/>
								<Route
									path="new-chat/session"
									element={
										<ProtectedRoute element={<Workzone />} />
									}
								/>
								<Route
									path="new-chat/*"
									element={
										<ProtectedRoute element={<NewChat />} />
									}
								/>
								<Route
									path="dashboard"
									element={
										<ProtectedRoute element={<Dashboard />} />
									}
								/>
								<Route
									path="dashboard/content"
									element={
										<ProtectedRoute
											element={<DashboardDetailsPage />}
										/>
									}
								/>
								<Route
									path="dashboard/*"
									element={
										<ProtectedRoute element={<Dashboard />} />
									}
								/>
								<Route
									path="configuration/datasource"
									element={
										<ProtectedRoute element={<DataSource />} />
									}
								/>
								<Route
									path="configuration"
									element={
										<ProtectedRoute
											element={<Configuration />}
										/>
									}
								/>
								<Route
									path="help"
									element={<ProtectedRoute element={<Help />} />}
								/>
								<Route
									path="reports/datasources/report"
									element={
										<ProtectedRoute
											element={<ReportsInDatasource />}
										/>
									}
								/>
								<Route
									path="reports/datasources"
									element={
										<ProtectedRoute
											element={<ReportFolders />}
										/>
									}
								/>
								{/* New Business Process Routes */}
								<Route
									path="business-process"
									element={
										<ProtectedRoute
											element={<BusinessProcessPage />}
										/>
									}
								/>
								<Route
									path="business-process/:businessProcessId"
									element={
										<ProtectedRoute
											element={<SingleBusinessProcessPage />}
										/>
									}
								/>
								<Route
									path="business-process/:businessProcessId/workflows/:workflowId"
									element={
										<ProtectedRoute
											element={<WorkflowPage />}
										/>
									}
								/>
							</Routes>
						</Layout>
					}
				/>
				<Route path="test" element={<TestRoute />} />
			</Routes>
		</>
	);
};

export default AppRoutes;