page 50001 "WebChatPage Factbox"
{
    ApplicationArea = All;
    Caption = 'Agente de ventas';
    PageType = CardPart;

    layout
    {
        area(content)
        {
            usercontrol(WebPageViewer; WebPageViewer)
            {
                trigger ControlAddInReady(CallbackUrl: Text)
                begin
                    CurrPage.WebPageViewer.Navigate('https://zapaceig.github.io/zapaceig/indexmini.html');
                end;
            }
        }
    }
}