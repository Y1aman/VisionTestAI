namespace VisionTestAI.Application.Common.Models;

/// <summary>
/// Standard result wrapper for all operations.
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string? ErrorAr { get; set; }
    public int StatusCode { get; set; } = 200;

    public static Result<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static Result<T> Failure(string error, string? errorAr = null, int statusCode = 400)
        => new() { IsSuccess = false, Error = error, ErrorAr = errorAr, StatusCode = statusCode };
}

public class Result
{
    public bool IsSuccess { get; set; }
    public string? Error { get; set; }
    public string? ErrorAr { get; set; }
    public int StatusCode { get; set; } = 200;

    public static Result Success() => new() { IsSuccess = true };
    public static Result Failure(string error, string? errorAr = null, int statusCode = 400)
        => new() { IsSuccess = false, Error = error, ErrorAr = errorAr, StatusCode = statusCode };
}
