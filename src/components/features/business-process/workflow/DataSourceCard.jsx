import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataSourceSelector } from './DataSourceSelector';
import { RefreshCw } from 'lucide-react';
import QueueStatus from '../../new-chat/QueueStatus';
import { ErrorResolutionModal } from './ErrorResolutionModal';
import ValidationOutput from './ValidationOutput';
import VariablesSection from './VariablesSection';
import { getWorkflowRunDetails, initiateWorkflowCheck } from '../service/workflow.service';
import { getToken } from '@/lib/utils';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const DataSourceCard = ({ onValidationSuccess, variables, workflowId, runId, dataPoints }) => {
  const navigate = useNavigate();
  const { businessProcessId } = useParams();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDatasourceId, setselectedDatasourceId] = useState(null);
  const [validationStatus, setValidationStatus] = useState(runId ? 'IN_QUEUE' : 'idle');
  const [validationResult, setValidationResult] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [currentValidationText, setCurrentValidationText] = useState('');
  const [activeTab, setActiveTab] = useState(null);

  const { data: runDetails, isLoading: isRunLoading } = useQuery({
    queryKey: ['workflow-run-details', runId],
    queryFn: () => getWorkflowRunDetails(getToken(), workflowId, runId),
    enabled: Boolean(runId) && validationStatus !== 'NEED_CLARIFICATION',
    refetchInterval: runId && validationStatus !== 'NEED_CLARIFICATION' ? 5000 : false,
  });

  useEffect(() => {
    if (runDetails) {
      setValidationResult(runDetails.validationResult);
      setCurrentValidationText(runDetails?.data?.status_text || '');
      setselectedDatasourceId(runDetails?.datasource_id);
      const newStatus = runDetails.status;
      if (['IN_QUEUE', 'VALIDATING'].includes(newStatus)) {
        setValidationStatus('validating');
      } else if (newStatus === 'NEED_CLARIFICATION') {
        setValidationStatus('NEED_CLARIFICATION');
      }
    }
  }, [runDetails]);

  useEffect(() => {
    onValidationSuccess(validationResult?.status === 'valid');
  }, [validationResult, onValidationSuccess]);

  const initiateWorkflowCheckMutation = useMutation({
    mutationFn: ({ workflowId, payload }) => initiateWorkflowCheck(getToken(), workflowId, payload),
    onSuccess: (data) => {
      toast.success('Workflow initiated successfully');
      if (data?.external_id) {
        navigate(`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}`);
      }
    },
    onError: (err) => {
      console.error('Workflow initiation failed!', err);
      toast.error(`Something went wrong: ${err.message}`);
    },
  });

  const handleContinue = (data) => {
    setValidationStatus('validating');
    if (data?.datasource_id) {
      initiateWorkflowCheckMutation.mutateAsync({
        workflowId,
        payload: { datasource_id: data.datasource_id },
      });
    }
  };

  const handleOpenModal = () => {
    if (validationStatus === 'validating') return;
    if (validationResult || selectedDatasourceId) {
      if (!window.confirm('Your progress will be lost. Do you want to continue?')) return;
      setselectedDatasourceId(null);
      setValidationResult(null);
      setValidationStatus('idle');
    }
    setIsModalOpen(true);
  };

  const handleTabClick = (fileName) => {
    setActiveTab(fileName === activeTab ? null : fileName);
  };

  const renderRecommendations = () => {
    if (!dataPoints || dataPoints.length === 0) return null;
  
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Recommendations</h3>
        <div className="w-full overflow-x-auto flex gap-4">
          {dataPoints.map((file) => (
            <Button
              key={file.file_name || 'additional'}
              variant="outline"
              className={`rounded-lg font-medium px-4 py-2 min-w-fit max-w-[19.25rem] border ${
                activeTab === file.file_name ? 'text-purple-100 border-purple-40 tabActiveBg' : 'text-black/60 border-black/10'
              }`}
              onClick={() => handleTabClick(file.file_name)}
            >
              {file.file_name || 'Additional Recommendations'}
            </Button>
          ))}
        </div>
  
        {activeTab && (
          <div className="mt-4 rounded-xl  h-fit p-4 w-full">
            {/* <h4 className="text-base font-semibold text-primary80 mb-2">{activeTab}</h4> */}
            <ul className=" flex items-center rounded-full gap-2 text-sm text-black/80">
              {dataPoints
                .find((file) => file.file_name === activeTab)
                ?.headers.map((header) => (
                  <li key={header.name} className="p-2 bg-white border rounded-xl shadow-sm">
                    {header.name}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  

  const handleErrorClick = (file) => {
    setResolutionFile(file);
    setIsResolutionOpen(true);
  };

  const handleResolutionComplete = ({ fileName, mappings }) => {
    setValidationResult((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.fileName === fileName ? { ...f, status: 'resolved', mappings } : f
      ),
    }));
  };

  return (
    <>
      <Card className="mb-8 text-primary80 border border-black/10 rounded-xl shadow-none">
        <CardHeader>
          <div className="flex justify-between border-b pb-3">
            <div>
              <CardTitle className="text-lg font-semibold">Data Source</CardTitle>
              <CardDescription className="text-sm text-primary60">
                Securely connect to a datasource
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {validationResult && validationStatus !== 'NEED_CLARIFICATION' && (
                <Button
                  variant="outline"
                  className="rounded-lg font-medium"
                  onClick={() => setValidationStatus('validating')}
                  disabled={validationStatus === 'validating'}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Re-validate
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
                onClick={handleOpenModal}
                disabled={validationStatus === 'validating'}
              >
                {selectedDatasourceId ? 'Try another data source' : 'Connect Data Source'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderRecommendations()}

          {validationStatus === 'validating' && <QueueStatus text={currentValidationText} />}
          <VariablesSection variables={variables} />
        </CardContent>
      </Card>

      <DataSourceSelector
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onContinue={handleContinue}
      />
      <ErrorResolutionModal
        open={isResolutionOpen}
        onOpenChange={setIsResolutionOpen}
        file={resolutionFile}
        onResolutionComplete={handleResolutionComplete}
      />
    </>
  );
};

export default DataSourceCard;
