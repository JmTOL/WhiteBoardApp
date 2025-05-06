using System;

namespace WhiteBoardApp.Models
{
    public class Note : Element
    {
        public string Title { get; set; } = string.Empty;
        public string Color { get; set; } = "#ffd700"; // Default yellow color
    }
} 