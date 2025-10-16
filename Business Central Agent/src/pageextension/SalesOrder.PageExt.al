pageextension 50002 "Sales Order" extends "Sales Order"
{
    layout
    {
        addfirst(factboxes)
        {
            part(WebChatPageFactbox; "WebChatPage Factbox")
            {
                ApplicationArea = All;
                Caption = 'Agente';
            }
        }
    }
}