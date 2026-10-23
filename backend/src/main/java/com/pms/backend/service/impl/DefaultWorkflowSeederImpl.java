package com.pms.backend.service.impl;

import com.pms.backend.service.interfaces.*;

import com.pms.backend.dao.WorkflowStatusRepository;
import com.pms.backend.dao.WorkflowTransitionRepository;
import com.pms.backend.enu.StatusCategory;
import com.pms.backend.enu.TransitionType;
import com.pms.backend.model.Project;
import com.pms.backend.model.WorkflowStatus;
import com.pms.backend.model.WorkflowTransition;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultWorkflowSeederImpl implements IDefaultWorkflowSeeder {

    private final WorkflowStatusRepository statusRepository;
    private final WorkflowTransitionRepository transitionRepository;

    public DefaultWorkflowSeederImpl(WorkflowStatusRepository statusRepository,
                                 WorkflowTransitionRepository transitionRepository) {
        this.statusRepository = statusRepository;
        this.transitionRepository = transitionRepository;
    }

    @Transactional
    public void seedDefaultWorkflow(Project project) {
        // 1. Statuses
        WorkflowStatus todo = new WorkflowStatus();
        todo.setProject(project);
        todo.setName("To Do");
        todo.setCategory(StatusCategory.TODO);
        todo.setPosition(0);
        todo.setInitial(true);
        todo = statusRepository.save(todo);

        WorkflowStatus inProgress = new WorkflowStatus();
        inProgress.setProject(project);
        inProgress.setName("In Progress");
        inProgress.setCategory(StatusCategory.IN_PROGRESS);
        inProgress.setPosition(1);
        inProgress.setInitial(false);
        inProgress = statusRepository.save(inProgress);

        WorkflowStatus pendingApproval = new WorkflowStatus();
        pendingApproval.setProject(project);
        pendingApproval.setName("Pending Approval");
        pendingApproval.setCategory(StatusCategory.IN_PROGRESS);
        pendingApproval.setPosition(2);
        pendingApproval.setInitial(false);
        pendingApproval = statusRepository.save(pendingApproval);

        WorkflowStatus done = new WorkflowStatus();
        done.setProject(project);
        done.setName("Done");
        done.setCategory(StatusCategory.DONE);
        done.setPosition(3);
        done.setInitial(false);
        done = statusRepository.save(done);

        // 2. Transitions
        createTransition(project, todo, inProgress, "Start Progress", TransitionType.NORMAL);
        createTransition(project, inProgress, pendingApproval, "Submit for Approval", TransitionType.NORMAL);
        createTransition(project, pendingApproval, done, "Approve", TransitionType.APPROVE);
        createTransition(project, pendingApproval, inProgress, "Reject", TransitionType.REJECT);
        createTransition(project, done, todo, "Reopen", TransitionType.NORMAL);
    }

    private void createTransition(Project project, WorkflowStatus from, WorkflowStatus to, String name, TransitionType type) {
        WorkflowTransition transition = new WorkflowTransition();
        transition.setProject(project);
        transition.setFromStatus(from);
        transition.setToStatus(to);
        transition.setName(name);
        transition.setType(type);
        transitionRepository.save(transition);
    }
}
