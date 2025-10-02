pageextension 50000 "Customer List" extends "Customer List"
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