namespace DigitalButler.Api.DTOs;

public class UpdateTaskRequest
{
    public string Title {get; set;} = string.Empty;
    public string? Description {get; set;}

}