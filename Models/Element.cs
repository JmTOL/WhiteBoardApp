using System;

namespace WhiteBoardApp.Models
{
    public class Element
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public double PositionX { get; set; }
        public double PositionY { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
} 