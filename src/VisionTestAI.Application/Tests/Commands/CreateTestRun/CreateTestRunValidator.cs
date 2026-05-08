using FluentValidation;

namespace VisionTestAI.Application.Tests.Commands.CreateTestRun;

public class CreateTestRunValidator : AbstractValidator<CreateTestRunCommand>
{
    public CreateTestRunValidator()
    {
        RuleFor(x => x.Prompt)
            .NotEmpty().WithMessage("Test description is required / وصف الاختبار مطلوب")
            .MinimumLength(10).WithMessage("Description must be at least 10 characters / يجب أن يكون الوصف 10 أحرف على الأقل")
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters / يجب ألا يتجاوز الوصف 2000 حرف");

        RuleFor(x => x.TargetUrl)
            .NotEmpty().WithMessage("Target URL is required / رابط الموقع مطلوب")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var result) &&
                         (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps))
            .WithMessage("Please provide a valid HTTP/HTTPS URL / يرجى إدخال رابط صحيح");
    }
}
