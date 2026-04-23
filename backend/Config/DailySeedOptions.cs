namespace DigitalButler.Api.Config;

public class DailySeedOptions
{
    public const string SectionName = "DailySeed";

    public List<DailySeedJob> Jobs { get; set; } = [];
}

public class DailySeedJob
{
    public string OwnerEmail { get; set; } = string.Empty;
    public string WorkspaceName { get; set; } = string.Empty;
    public string TimeZone { get; set; } = "Europe/Stockholm";
    public string ProjectNameFormat { get; set; } = "ddd MMM d";
    public Dictionary<string, string> Users { get; set; } = new();
    public List<DailySeedTask> Tasks { get; set; } = [];
}

public class DailySeedTask
{
    public string Title { get; set; } = string.Empty;
    public string AssigneeAlias { get; set; } = string.Empty;
}
