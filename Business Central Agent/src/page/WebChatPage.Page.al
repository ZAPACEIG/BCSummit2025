page 50000 WebChatPage
{
    ApplicationArea = All;
    Caption = 'Agente';
    PageType = Card;
    UsageCategory = Administration;


    layout
    {
        area(content)
        {
            usercontrol(WebPageViewer; WebPageViewer)
            {
                trigger ControlAddInReady(CallbackUrl: Text)
                begin
                    CurrPage.WebPageViewer.Navigate('https://zapaceig.github.io/BCSummit2025/Web%20Chat/index.html');
                end;
            }
        }
    }
}