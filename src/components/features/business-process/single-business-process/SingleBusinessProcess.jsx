import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getToken } from '@/lib/utils';
import EmptyState from '@/components/elements/EmptyState';
import WorkflowCard from './WorkflowCard';
import WorkflowSkeleton from './WorkflowCardSkeleton';
import { getBusinessProcesses, getWorkflowsByBusinessProcess } from '../service/workflow.service';


const EmptyStateWrapper = ({ config }) => (
  <div className="flex justify-center">
    <EmptyState className="h-full" config={config} />
  </div>
);

const SearchBar = ({ search, setSearch, isFocused, setIsFocused }) => (
  <div
    className={cn(
      'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
      { 'w-[300px]': isFocused, 'w-[180px]': !isFocused },
    )}
  >
    <i className="bi-search text-primary40 me-2"></i>
    <Input
      placeholder="Search"
      className={cn(
        'border-none rounded-sm px-0 text-primary40 font-medium bg-transparent',
      )}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  </div>
);

const SingleBusinessProcessPage = () => {
  const navigate = useNavigate();
  const { businessProcessId } = useParams();
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Fetch business processes
  const { data: businessProcessesData, isLoading: isBusinessLoading } = useQuery({
    queryKey: ['get-business-processes'],
    queryFn: () => getBusinessProcesses(getToken()),
  });

  // Fetch workflows
  const { data: workflowsData, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['get-workflows-by-business-process', businessProcessId],
    queryFn: () => getWorkflowsByBusinessProcess(getToken(), businessProcessId),
    enabled: !!businessProcessId
  });

  // Find matching business process
  const businessProcess = useMemo(() => {
    return businessProcessesData?.processes?.find(
      bp => bp.external_id === businessProcessId
    );
  }, [businessProcessesData, businessProcessId]);

  // Process workflows data
  const workflows = useMemo(() => 
    workflowsData?.workflow_checks || []
  , [workflowsData]);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    if (!search) return workflows;
    return workflows.filter(({ name, tags }) =>
      name?.toLowerCase().includes(search.toLowerCase()) ||
      tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [workflows, search]);

  // Skeleton components
  const BreadcrumbSkeleton = () => (
    <div className="h-6 w-48 bg-primary10 rounded animate-pulse"></div>
  );

  const HeaderSkeleton = () => (
    <>
      <div className="h-7 w-32 bg-primary10 rounded animate-pulse"></div>
      <div className="h-5 w-64 bg-primary10 rounded animate-pulse"></div>
    </>
  );

  const emptyStateConfig = {
    image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
    actionText: 'Create your first workflow by clicking the button above,',
    reactionText: 'your workflows will appear here...',
    ctaText: 'Create New Workflow',
    ctaDisabled: true,
    ctaClickHandler: () => {},
    comingSoonText: 'Custom workflow creation coming soon...',
  };

  return (
    <div className="h-full w-full text-primary80">
      <header className="max-w-full mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h1
            onClick={() => navigate('/app/business-process')}
            className="text-2xl font-semibold cursor-pointer"
          >
            Business Process
          </h1>
          <span>/</span>
          {isBusinessLoading ? (
            <BreadcrumbSkeleton />
          ) : (
            <span>{businessProcess?.name || 'Unnamed Process'}</span>
          )}
        </div>
      </header>

      <section className="max-w-full p-2 border-2 border-primary8 shadow-1xl bg-white rounded-3xl">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {isBusinessLoading ? (
                <HeaderSkeleton />
              ) : (
                <>
                  <h3 className="text-xl font-semibold">
                    {businessProcess?.name || 'Unnamed Process'}
                  </h3>
                  <p className="text-primary40">
                    Manage, view and edit your workflows
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <SearchBar
                search={search}
                setSearch={setSearch}
                isFocused={isFocused}
                setIsFocused={setIsFocused}
              />
              <Button
                className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
                onClick={() => alert('implement create new workflow')}
              >
                Create New Workflow
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 mb-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-270px)]">
          {isWorkflowsLoading ? (
            <>
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />
            </>
          ) : workflows.length === 0 ? (
            <EmptyStateWrapper config={emptyStateConfig} />
          ) : filteredWorkflows.length > 0 ? (
            filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.external_id}
                workflow={workflow}
              />
            ))
          ) : (
            <div className="w-full p-6 border border-primary1 rounded-s-xl rounded-e-xl">
              <p className="text-lg text-center text-primary60 font-medium">
                No matching workflows found
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SingleBusinessProcessPage;