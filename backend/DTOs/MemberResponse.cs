namespace DigitalButler.Api.DTOs;

using DigitalButler.Api.Models;

public class MemberResponse
{
    public Guid UserId { get; set; }
    public string Email {get; set;} = string.Empty;
    public WorkspaceRole Role { get; set; }

}