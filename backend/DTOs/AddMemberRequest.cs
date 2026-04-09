namespace DigitalButler.Api.DTOs;
using DigitalButler.Api.Models;

public class AddMemberRequest
{
    public string Email {get; set;} = string.Empty;
    public WorkspaceRole Role { get; set; }
}