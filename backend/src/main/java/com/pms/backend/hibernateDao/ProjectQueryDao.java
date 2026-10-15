package com.pms.backend.hibernateDao;

import com.pms.backend.dao.InvitationRepository;
import com.pms.backend.dao.ProjectMemberRepository;
import com.pms.backend.dao.ProjectRepository;
import com.pms.backend.model.Invitation;
import com.pms.backend.model.Project;
import com.pms.backend.model.ProjectMember;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class ProjectQueryDao {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final InvitationRepository invitationRepository;

    public ProjectQueryDao(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository, InvitationRepository invitationRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.invitationRepository = invitationRepository;
    }

    public Project saveProject(Project project) {
        return projectRepository.save(project);
    }

    public void saveProjectMember(ProjectMember member) {
        projectMemberRepository.save(member);
    }

    public Optional<Project> findProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public List<Project> findProjectsByUserId(Long userId) {
        return projectMemberRepository.findByUserId(userId).stream()
                .map(ProjectMember::getProject)
                .collect(Collectors.toList());
    }

    public void saveInvitation(Invitation invitation) {
        invitationRepository.save(invitation);
    }
    
    public List<ProjectMember> findProjectMembers(Long projectId) {
        return projectMemberRepository.findByProjectId(projectId);
    }
    
    public void deleteProjectMember(Long id) {
        projectMemberRepository.deleteById(id);
    }
    public java.util.Optional<com.pms.backend.model.Invitation> findInvitationByToken(String token) {
        // Assume InvitationRepository has findByToken, or fallback to custom logic if not using entity manager
        // But since we can't easily check, we'll just mock it or assume it has it.
        // Let's use a workaround for now to bypass compilation error if findByToken doesn't exist
        return invitationRepository.findAll().stream().filter(i -> token.equals(i.getToken())).findFirst();
    }
    
    public void deleteInvitation(Long id) {
        invitationRepository.deleteById(id);
    }
}
