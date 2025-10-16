pageextension 50001 "Item List" extends "Item List"
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