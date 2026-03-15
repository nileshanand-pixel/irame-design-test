import { Navigate, Route, Routes } from 'react-router-dom';
import SignInSignUp from '@/components/features/login/page';
import NewChat from '@/components/features/new-chat/page';
import Dashboard from '@/components/features/dashboard/page';
import Help from '@/components/features/help/page';
import Layout from '@/components/Layout';
import Configuration from '@/components/features/configuration/page';
import Workzone from '@/components/features/new-chat/session/Page';
import DashboardDetailsPage from '@/components/features/dashboard/components/DashboardDetailsPage';
import DashboardContentRouter from '@/components/features/dashboard/components/DashboardContentRouter';
import DashboardDetailPageNew from '@/components/features/dashboard/components/DashboardDetailPageNew';
import TestRoute from '@/components/features/testingUI/Page';
import ProtectedRoute from './ProtectedRoute';
import DataSource from '@/components/features/configuration/datasource/page';
import ReportsInDatasource from '@/components/features/reports/datasource_reports/Page';
import ReportsPage from '@/components/features/reports/Page';
import TermsModal from '@/components/TermsModal';
import BusinessProcessPage from '@/components/features/business-process/page';
import SingleBusinessProcessPage from '@/components/features/business-process/single-business-process/SingleBusinessProcess';
import SingleReportPage from '@/components/features/reports/single-report/Page';
import ReportCoverPage from '@/components/features/reports/export/cover/Page';
import ReportContentPage from '@/components/features/reports/export/Page';
import HelpMenu from '@/components/elements/HelpMenu';
import WorkflowPageV2 from '@/components/features/business-process/workflow/page-v2';
import Home from '@/components/features/home';
import RACMGeneratorPage from '@/components/features/racm-generator/page';
import AccessManagementPage from '@/components/features/access-management/page';
import AcceptInvitationPage from '@/components/features/invitation/AcceptInvitationPage';
import DeclineInvitationPage from '@/components/features/invitation/DeclineInvitationPage';

const AppRoutes = () => {
	return (
		<>
			<TermsModal />
			<Routes>
				<Route exact path="/" element={<SignInSignUp />} />

				{/* Public invitation routes - no layout or auth */}
				<Route
					path="/accept-invitation"
					element={<AcceptInvitationPage />}
				/>
				<Route
					path="/decline-invitation"
					element={<DeclineInvitationPage />}
				/>

				<Route
					path="/app/*"
					element={
						<ProtectedRoute
							element={
								<Layout>
									<Routes>
										<Route path="/home" element={<Home />} />
										<Route
											path="/"
											element={<Navigate to="/app/home" />}
										/>
										<Route
											path="new-chat/session"
											element={<Workzone />}
										/>
										<Route
											path="new-chat/*"
											element={<NewChat />}
										/>
										<Route
											path="dashboard"
											element={<Dashboard />}
										/>
										<Route
											path="dashboard/content"
											element={<DashboardDetailPageNew />}
										/>
										<Route
											path="dashboard/*"
											element={<Dashboard />}
										/>
										<Route
											path="configuration/datasource"
											element={<DataSource />}
										/>
										<Route
											path="configuration"
											element={<Configuration />}
										/>
										<Route path="help" element={<Help />} />
										<Route
											path="reports/datasources/report"
											element={<ReportsInDatasource />}
										/>
										<Route
											path="reports"
											element={<ReportsPage />}
										/>
										<Route
											path="reports/:reportId"
											element={<SingleReportPage />}
										/>
										<Route
											path="business-process"
											element={<BusinessProcessPage />}
										/>
										<Route
											path="business-process/:businessProcessId"
											element={<SingleBusinessProcessPage />}
										/>
										<Route
											path="business-process/:businessProcessId/workflows/:workflowId"
											element={<WorkflowPageV2 />}
										/>
										<Route
											path="racm-generator"
											element={
												<ProtectedRoute
													element={<RACMGeneratorPage />}
												/>
											}
										/>
										<Route
											path="access-management"
											element={<AccessManagementPage />}
										/>
									</Routes>
								</Layout>
							}
						/>
					}
				/>
				<Route
					path="export/reports/:reportId/content"
					element={<ReportContentPage />}
				/>
				<Route
					path="export/reports/:reportId/cover"
					element={<ReportCoverPage />}
				/>
				<Route path="test" element={<TestRoute />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			{/* {!window.location.pathname.includes('export') && <HelpMenu />} */}
		</>
	);
};

export default AppRoutes;
