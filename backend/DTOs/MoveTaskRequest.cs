namespace DigitalButler.Api.DTOs;

using DigitalButler.Api.Models;

public class MoveTaskRequest
{
    public TaskStatus NewStatus {get; set;}
    public int NewPosition {get; set;}

}