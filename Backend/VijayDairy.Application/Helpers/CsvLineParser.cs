using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace VijayDairy.Application.Helpers;

public static class CsvLineParser
{
    private static readonly char[] CandidateDelimiters = { ',', ';', '\t' };

    /// <summary>
    /// Excel writes ';' (some regional settings) or tab ("Text (Tab delimited)") instead of ',' — pick whichever
    /// the header line actually uses. Ties and no-match fall back to ','.
    /// </summary>
    public static char DetectDelimiter(string headerLine)
    {
        char best = ',';
        int bestCount = 0;
        foreach (var d in CandidateDelimiters)
        {
            int count = Split(headerLine, d).Count(c => c.Trim().Length > 0);
            if (count > bestCount) { best = d; bestCount = count; }
        }
        return best;
    }

    /// <summary>True when every cell is blank — Excel often leaves rows like ",,,,," at the end of a sheet.</summary>
    public static bool IsBlankRow(IEnumerable<string> cells) => cells.All(c => string.IsNullOrWhiteSpace(c));

    /// <summary>Splits one CSV line, honouring double-quoted fields and "" escapes.</summary>
    public static List<string> Split(string line, char delimiter = ',')
    {
        var result = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"') { current.Append('"'); i++; }
                    else inQuotes = false;
                }
                else current.Append(c);
            }
            else
            {
                if (c == '"') inQuotes = true;
                else if (c == delimiter) { result.Add(current.ToString()); current.Clear(); }
                else current.Append(c);
            }
        }
        result.Add(current.ToString());
        return result;
    }
}
